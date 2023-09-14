const getArguments = require('./lib/arguments');
const signIn = require('./lib/signin');
const importData = require('./lib/importData');
const { exportData } = require('./lib/exportData');
const watchData = require('./lib/watchData');
const preview = require('./lib/preview');

const commandHandlers = {
  'signin': signIn,
  'import': (args) => importData(args.domain, args.collection, args.format),
  'export': (args) => exportData(args.domain, args.collection, args.format),
  'watch': (args) => watchData(args.domain, args.collection, args.format),
  'preview': (args) => preview(args.domain, args.template)
};

(async () => {
  try {
    const argv = await getArguments();
    const command = argv._[0];

    if (commandHandlers[command]) {
      commandHandlers[command](argv);
    } else {
      console.error('Invalid command. For help, visit https://github.com/nodriza-io/jetpack/blob/main/README.md');
      // Optionally, you can display a help message here with available commands.
    }
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
})();
