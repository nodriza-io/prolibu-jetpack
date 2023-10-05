const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const getArguments = require('./lib/arguments');
const signIn = require('./lib/signin');
const signOut = require('./lib/signout');
const importData = require('./lib/importData');
const { exportData } = require('./lib/exportData');
const watchData = require('./lib/watchData');
const preview = require('./lib/preview');
global.u = require('./lib/Utils');
global._ = require('lodash');

const commandHandlers = {
  signin: signIn,
  signout: signOut,
  import: (args) => importData(args.domain, args.collection, args.format, args.query),
  export: (args) => exportData(args.domain, args.collection, args.format),
  watch: (args) => watchData(args.domain, args.collection, args.format),
  preview: (args) => preview(args.domain, args.template, args.port, args.autoupload),
};

(async () => {
  try {
    const yargsInstance = yargs(hideBin(process.argv));
    const argv = await getArguments(yargsInstance);

    const command = argv._[0];

    if (commandHandlers[command]) {
      commandHandlers[command](argv);
    } else {
      yargsInstance.showHelp();
    }
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
})();
