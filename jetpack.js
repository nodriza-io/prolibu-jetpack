const getArguments = require('./lib/arguments');
const signIn = require('./lib/signin');
const importData = require('./lib/importData');
const { exportData } = require('./lib/exportData');
const watchData = require('./lib/watchData');

// Use an IIFE (Immediately Invoked Function Expression) to handle async code
(async () => {
  const argv = await getArguments();

  // Main command handling logic:
  if (argv._[0] === 'signin') {
    signIn();
  } else if (argv._[0] === 'import') {
    importData(argv.domain, argv.collection, argv.format);
  } else if (argv._[0] === 'export') {
    exportData(argv.domain, argv.collection, argv.format);
  } else if (argv._[0] === 'watch') {
    watchData(argv.domain, argv.collection, argv.format);
  } else {
    console.error('Invalid command. For help, visit https://github.com/nodriza-io/jetpack/blob/main/README.md');
  }
})();
