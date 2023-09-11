const getArguments = require('./lib/arguments');
const signIn = require('./lib/signin');
const importData = require('./lib/importData');
const exportData = require('./lib/exportData'); // Importing the exportData function

const argv = getArguments();

// Main command handling logic:
if (argv._[0] === 'signin') {
  signIn();
} else if (argv._[0] === 'import') {
  importData();
} else if (argv._[0] === 'export') { // Adding a condition for 'export' command
  exportData();
} else if (argv._[0] === 'watch') {
  startWatching();
} else {
  console.error('Invalid command. For help, visit https://github.com/nodriza-io/jetpack/blob/main/README.md');
}
