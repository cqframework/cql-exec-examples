const fs = require('fs');
const path = require('path');
const cql = require('cql-execution');
const cqlfhir = require('cql-exec-fhir');
const cqlvsac = require('cql-exec-vsac');

let pathToPatients = path.join(__dirname, 'patients');
let vsacUser, vsacPass;
if (process.argv.length == 3) {
  // node ./index.js /path/to/patients
  pathToPatients = process.argv[2];
} else if (process.argv.length == 4) {
  // node ./index.js vsacUser vsacPassword
  [vsacUser, vsacPass] = process.argv.slice(2);
} else if (process.argv.length == 5) {
  // node ./index.js /path/to/patients vsacUser vsacPassword
  [pathToPatients, vsacUser, vsacPass] = process.argv.slice(2);
}

console.log('/-------------------------------------------------------------------------------');
console.log('| Example:   PatientFinder');
console.log('|            Finds patients > 18 y.o. w/ condition indicating chronic pain');
console.log('| Usage:');
console.log('|            node ./index.js /path/to/patients vsacUser vsacPassword');
console.log('|            node ./index.js vsacUser vsacPassword');
console.log('|            node ./index.js /path/to/patients');
console.log('|            node ./index.js');
if (vsacUser) {
  console.log('| VSAC User: ', vsacUser);
}
console.log('\\-------------------------------------------------------------------------------');
console.log();

// Set up the library
const elmFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'cql', 'PatientFinderExample.json'), 'utf8'));
const libraries = {
  FHIRHelpers: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fhir-helpers', 'v1.0.2', 'FHIRHelpers.json'), 'utf8'))
};
const library = new cql.Library(elmFile, new cql.Repository(libraries));

// Create the patient source
const patientSource = cqlfhir.PatientSource.FHIRv102();

// Load the patient source with patients
const bundles = [];
const idToFileMap = new Map();
for (const fileName of fs.readdirSync(pathToPatients)) {
  const file = path.join(pathToPatients, fileName);
  if (!file.endsWith('.json')) {
    continue;
  }
  const bundle = JSON.parse(fs.readFileSync(file));
  const entry = bundle.entry.find(e => e.resource.resourceType === 'Patient');
  if (entry && entry.resource.id) {
    idToFileMap.set(entry.resource.id, file);
  }
  bundles.push(bundle);
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
    const matches = results.populationResults.MatchedIDs;
    console.log(`Found ${matches.length} matches:`);
    matches.forEach(id => console.log(idToFileMap.get(id)));
    console.log();
  })
  .catch( (err) => {
    // There was an error downloading the value sets!
    console.error('Error downloading value sets', err);
  });