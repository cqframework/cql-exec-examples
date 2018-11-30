const readline = require('readline');

function printMenu() {
  console.log('/-------------------------------------------------------------------------------');
  console.log('| CQL Execution Examples');
  console.log('\\-------------------------------------------------------------------------------');
  console.log();
  console.log('[1] Diabetic Foot Example (FHIR DSTU2)');
  console.log('[2] Patient Finder');
  console.log('[Q] Quit');
  console.log();
  console.log('Choose an example to run: ');
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (c) => {
  console.log();
  switch(c) {
  case 'Q', 'q':
    process.exit();
    break;
  case '1':
    require('./diabetic-foot-exam');
    break;
  case '2':
    require('./patient-finder');
    break;
  default:
    console.log('Invalid option: ', c);
  }
  process.stdin.pause();
});

printMenu();
