const readline = require('readline');
const dfeRunner = require('./diabetic-foot-exam/runner');
const pfRunner = require('./patient-finder/runner');

function exit(err) {
  if (err) {
    process.exit();
  } else {
    process.exit(1);
  }
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (c) => {
  console.log();
  switch(c) {
  case 'Q', 'q':
    exit();
    break;
  case '1':
    dfeRunner('dstu2', exit);
    break;
  case '2':
    dfeRunner('stu3', exit);
    break;
  case '3':
    dfeRunner('r4', exit);
    break;
  case '4':
    pfRunner('dstu2', exit);
    break;
  case '5':
    pfRunner('stu3', exit);
    break;
  case '6':
    pfRunner('r4', exit);
    break;
  default:
    console.log('Invalid option: ', c);
    console.log();
    exit(1);
  }
});

console.log('/-------------------------------------------------------------------------------');
console.log('| CQL Execution Examples');
console.log('\\-------------------------------------------------------------------------------');
console.log();
console.log('[1] Diabetic Foot Example (FHIR DSTU2)');
console.log('[2] Diabetic Foot Example (FHIR STU3)');
console.log('[3] Diabetic Foot Example (FHIR R4)');
console.log('[4] Patient Finder (FHIR DSTU2)');
console.log('[5] Patient Finder (FHIR STU3)');
console.log('[6] Patient Finder (FHIR R4)');
console.log('[Q] Quit');
console.log();
console.log('Choose an example to run: ');
