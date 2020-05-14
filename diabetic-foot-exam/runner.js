const fs = require('fs');
const path = require('path');
const cql = require('cql-execution');
const cqlfhir = require('cql-exec-fhir');
const cqlvsac = require('cql-exec-vsac');

module.exports = function (version, callback = (err) => {}) {
  let vsacUser, vsacPass;
  if (process.argv.length == 4) {
    // node ./index.js vsacUser vsacPassword
    [vsacUser, vsacPass] = process.argv.slice(2);
  }

  console.log('/-------------------------------------------------------------------------------');
  console.log(`| Example:   Diabetic Foot Exam (${version})`);
  console.log('| Usage:');
  console.log(`|            node ./diabetic-foot-exam/${version}.js vsacUser vsacPassword`);
  console.log(`|            node ./diabetic-foot-exam/${version}.js`);

  if (vsacUser) {
    console.log('| VSAC User:', vsacUser);
  }
  console.log('\\-------------------------------------------------------------------------------');
  console.log();

  // Set up the library
  const elmFile = JSON.parse(fs.readFileSync(path.join(__dirname, version, 'cql', 'DiabeticFootExam.json'), 'utf8'));
  const libraries = {
    FHIRHelpers: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fhir-helpers', version, 'FHIRHelpers.json'), 'utf8'))
  };
  const library = new cql.Library(elmFile, new cql.Repository(libraries));

  // Create the patient source
  let patientSource;
  switch (version) {
  case 'dstu2': patientSource = cqlfhir.PatientSource.FHIRv102(); break;
  case 'stu3': patientSource = cqlfhir.PatientSource.FHIRv300(); break;
  case 'r4': patientSource = cqlfhir.PatientSource.FHIRv400(); break;
  default: patientSource = cqlfhir.PatientSource.FHIRv400(); break;
  }

  // Load the patient source with patients
  const bundles = [];
  const patientsPath = path.join(__dirname, version, 'patients');
  for (const fileName of fs.readdirSync(patientsPath)) {
    const file = path.join(patientsPath, fileName);
    if (!file.endsWith('.json')) {
      continue;
    }
    const json = JSON.parse(fs.readFileSync(file));
    // Need to modify the date for the recent foot exam example
    if (fileName === 'Recent_Foot_Exam.json') {
      const procedureDate = new Date();
      procedureDate.setMonth(procedureDate.getMonth() - 3);
      const procedureDateStr = procedureDate.toISOString().slice(0, 10);
      json.entry.forEach(entry => {
        if (entry.resource.resourceType === 'Procedure') {
          entry.resource.performedDateTime = procedureDateStr;
        }
      });
    }
    bundles.push(json);
  }
  patientSource.loadBundles(bundles);

  // Extract the value sets from the ELM
  let valueSets = [];
  if (elmFile.library && elmFile.library.valueSets && elmFile.library.valueSets.def) {
    valueSets = elmFile.library.valueSets.def;
  }

  // Set up the code service, loading from the cache if it exists
  const codeService = new cqlvsac.CodeService(path.join(__dirname, 'vsac_cache'), true);
  // Ensure value sets, downloading any missing value sets
  codeService.ensureValueSets(valueSets, vsacUser, vsacPass)
    .then(() => {
      // Value sets are loaded, so execute!
      const executor = new cql.Executor(library, codeService);
      const results = executor.exec(patientSource);
      for (const id in results.patientResults) {
        const result = results.patientResults[id];
        console.log(`${id}:`);
        console.log(`\tMeetsInclusionCriteria: ${result.MeetsInclusionCriteria}`);
        console.log(`\tNeedsFootExam: ${result.NeedsFootExam}`);
      }
      console.log();
      callback();
    })
    .catch( (err) => {
      // There was an error!
      console.error('Error', err);
      callback(err);
    });
};