const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function getArguments() {
  const args = yargs(hideBin(process.argv))
    .command('import [domain] [collection] [format]', 'Import data from Prolibu account', (yargs) => {
      yargs.positional('domain', {
        describe: 'Subdomain for Prolibu account (e.g., "dev4" for "dev4.prolibu.com")',
        type: 'string',
      })
        .positional('collection', {
          describe: 'Name of the collection',
          type: 'string',
        })
        .positional('format', {
          describe: 'Format of the data',
          type: 'string',
          choices: ['csv', 'json', 'xlsx'],
        });
    })
    .command('export [domain] [collection] [format]', 'Export data to Prolibu account')
    .command('watch [domain] [collection] [format]', 'Watch and sync changes for specific data')
    .command('preview [domain] [template] [port]', 'Preview a specific template', (yargs) => {
      yargs.positional('template', {
        describe: 'Name of the template',
        type: 'string',
      })
        .default('port', 3000);
    })
    .help('h')
    .alias('h', 'help')
    .argv;

  return args;
}

module.exports = getArguments;
