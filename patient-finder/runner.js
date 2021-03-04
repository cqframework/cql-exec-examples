const fs = require('fs');
const path = require('path');
const cql = require('cql-execution');
const cqlfhir = require('cql-exec-fhir');
const cqlvsac = require('cql-exec-vsac');

module.exports = function (version, callback = (err) => {}) {

  const pathToPatients = path.join(__dirname, version, 'patients');

  let umlsApiKey;
  if (process.argv.length == 3) {
    // node ./index.js umlsApiKey
    umlsApiKey = process.argv[2];
  }

  console.log('/-------------------------------------------------------------------------------');
  console.log(`| Example:   PatientFinder (${version})`);
  console.log('|            Finds patients > 18 y.o. w/ condition indicating chronic pain');
  console.log('| Usage:');
  console.log(`|            node ./patient-finder/${version}.js /path/to/patients vsacUser vsacPassword`);
  console.log(`|            node ./patient-finder/${version}.js vsacUser vsacPassword`);
  console.log(`|            node ./patient-finder/${version}.js /path/to/patients`);
  console.log(`|            node ./patient-finder/${version}.js`);
  console.log('\\-------------------------------------------------------------------------------');
  console.log();

  // Set up the library
  const elmFile = JSON.parse(fs.readFileSync(path.join(__dirname, version, 'cql', 'PatientFinderExample.json'), 'utf8'));
  const libraries = {
    FHIRHelpers: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fhir-helpers', version, 'FHIRHelpers.json'), 'utf8'))
  };
  const library = new cql.Library(elmFile, new cql.Repository(libraries));

  // Extract the value sets from the ELM
  let valueSets = [];
  if (elmFile.library && elmFile.library.valueSets && elmFile.library.valueSets.def) {
    valueSets = elmFile.library.valueSets.def;
  }

  // Set up the code service, loading from the cache if it exists
  const codeService = new cqlvsac.CodeService(path.join(__dirname, 'vsac_cache'), true);
  // Ensure value sets, downloading any missing value sets
  codeService.ensureValueSetsWithAPIKey(valueSets, umlsApiKey)
    .then(() => {
      // Value sets are loaded, so execute!
      execute(library, codeService, version, pathToPatients);
      callback();
    })
    .catch( (err) => {
      // There was an error downloading the value sets!
      console.error('Error downloading value sets', err);
      callback(err);
    });
};

function execute(library, codeService, version, pathToPatients) {
  // Create the patient source
  let patientSource;
  switch (version) {
  case 'dstu2': patientSource = cqlfhir.PatientSource.FHIRv102(); break;
  case 'stu3': patientSource = cqlfhir.PatientSource.FHIRv300(); break;
  case 'r4': patientSource = cqlfhir.PatientSource.FHIRv401(); break;
  default: patientSource = cqlfhir.PatientSource.FHIRv401(); break;
  }

  const executor = new cql.Executor(library, codeService);

  // Execute 100 at a time
  const bundles = [];
  const idToFileMap = new Map();
  const matches = [];
  const fileNames = fs.readdirSync(pathToPatients);
  for (let i=0; i< fileNames.length; i++) {
    if (i === 0 || i % 100 === 0) {
      const end = (i + 100) <= fileNames.length ? i + 100 : fileNames.length;
      console.log(`Processing patients ${i+1} to ${end}...`);
    }

    const file = path.join(pathToPatients, fileNames[i]);
    if (!file.endsWith('.json')) {
      continue;
    }
    const bundle = JSON.parse(fs.readFileSync(file));
    const entry = bundle.entry.find(e => e.resource.resourceType === 'Patient');
    if (entry && entry.resource.id) {
      idToFileMap.set(entry.resource.id, file);
    }
    bundles.push(bundle);

    if (i === (fileNames.length-1) || (i+1) % 100 === 0) {
      patientSource.loadBundles(bundles);
      const results = executor.exec(patientSource);
      matches.push(...results.unfilteredResults.MatchedIDs);
      bundles.length = 0;
      patientSource.reset();
    }
  }
  console.log(`Found ${matches.length} matches:`);
  matches.forEach(id => console.log(idToFileMap.get(id)));
  console.log();
}