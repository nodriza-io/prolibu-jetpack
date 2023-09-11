const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function getArguments() {
  return yargs(hideBin(process.argv))
    .command('signin', 'Sign in to a domain')
    .command('import', 'Import data from account')
    .help('h')
    .alias('h', 'help')
    .argv;
}

module.exports = getArguments;
