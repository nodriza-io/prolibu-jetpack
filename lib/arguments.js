const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function getArguments() {
  const args = yargs(hideBin(process.argv))
    .command('signin', 'Sign in to Prolibu account')
    .command('signout', 'Sign out from Prolibu account')
    .command(
      'import [domain] [collection] [format] [query]',
      'Import data from Prolibu account',
      (yargs) => yargs
        .positional('domain', {
          describe: 'Subdomain for Prolibu account',
          type: 'string',
          alias: 'd',
        })
        .positional('collection', {
          describe: 'Name of the collection',
          type: 'string',
          alias: 'c',
        })
        .positional('format', {
          describe: 'Format of the data',
          type: 'string',
          choices: ['csv', 'json', 'xlsx'],
          alias: 'f',
        })
        .positional('query', {
          describe: 'Import query filter',
          type: 'string',
          alias: 'q',
        })
        .check((argv) => {
          if (!argv.domain || !argv.collection || !argv.format) {
            throw new Error(
              'Please provide domain, collection, and format arguments for the import command.',
            );
          }
          return true;
        }),
    )
    .command(
      'export [domain] [collection] [format]',
      'Export data to Prolibu account',
      (yargs) => {
        yargs
          .positional('domain', {
            describe: 'Subdomain for Prolibu account',
            type: 'string',
            alias: 'd',
          })
          .positional('collection', {
            describe: 'Name of the collection',
            type: 'string',
            alias: 'c',
          })
          .positional('format', {
            describe: 'Format of the data',
            type: 'string',
            choices: ['csv', 'json', 'xlsx'],
            alias: 'f',
          })
          .check((argv) => {
            if (!argv.domain || !argv.collection || !argv.format) {
              throw new Error(
                'Please provide domain, collection, and format arguments for the export command.',
              );
            }
            return true;
          });
      },
    )
    .command(
      'watch [domain] [collection] [format]',
      'Watch and sync changes for specific data',
      (yargs) => {
        yargs
          .positional('domain', {
            describe: 'Subdomain for Prolibu account',
            type: 'string',
            alias: 'd',
          })
          .positional('collection', {
            describe: 'Name of the collection',
            type: 'string',
            alias: 'c',
          })
          .positional('format', {
            describe: 'Format of the data',
            type: 'string',
            choices: ['csv', 'json', 'xlsx'],
            alias: 'f',
          })
          .check((argv) => {
            if (!argv.domain || !argv.collection || !argv.format) {
              throw new Error(
                'Please provide domain, collection, and format arguments for the watch command.',
              );
            }
            return true;
          });
      },
    )
    .command(
      'preview [domain] [template] [port] [autoupload]',
      'Preview a specific template',
      (yargs) => {
        yargs
          .positional('domain', {
            describe: 'Subdomain for Prolibu account',
            type: 'string',
            alias: 'd',
          })
          .positional('template', {
            describe: 'Name of the template',
            type: 'string',
            alias: 't',
          })
          .positional('port', {
            describe: 'Port number for preview',
            type: 'number',
            default: 3000,
            alias: 'p',
          })
          .positional('autoupload', {
            describe: 'Auto upload template on .hsb or .json changes',
            type: 'boolean',
            default: false,
            alias: 'a',
          })
          .check((argv) => {
            if (!argv.domain || !argv.template) {
              throw new Error(
                'Please provide domain and template arguments for the preview command.',
              );
            }
            return true;
          });
      },
    )
    .command(
      'sync [domain] [targetPath] [selectExt]',
      'sync file manager',
      (yargs) => {
        yargs
          .positional('domain', {
            describe: 'Subdomain for Prolibu account',
            type: 'string',
            alias: 'd',
          })
          .positional('targetPath', {
            describe: 'Name of the template',
            type: 'string',
            alias: 't',
          })
          .positional('selectExt', {
            describe: 'Port number for preview',
            type: 'number',
            alias: 's',
          })
          .check((argv) => {
            if (!argv.domain) {
              throw new Error(
                'Please provide domain arguments for the sync command.',
              );
            }
            return true;
          });
      },
    )
    .help('h')
    .alias('h', 'help').argv;

  return args;
}

module.exports = getArguments;
