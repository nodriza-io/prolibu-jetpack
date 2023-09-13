const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

async function promptWithInquirer(message, type = 'input', choices = []) {
  const inquirer = (await import('inquirer')).default;
  inquirer.registerPrompt('autocomplete', (await import('inquirer-autocomplete-prompt')).default);

  const response = await inquirer.prompt({
    type,
    name: 'value',
    message,
    choices,
  });

  return response.value;
}

async function getArguments() {
  const args = yargs(hideBin(process.argv))
    .command('import [domain] [collection] [format]', 'Import data from Prolibu account')
    .command('export [domain] [collection] [format]', 'Export data to Prolibu account')
    .command('watch [domain] [collection] [format]', 'Watch and sync changes for specific data') // New command added
    .help('h')
    .alias('h', 'help')
    .argv;

  let {
    domain, collection, format, _,
  } = args;

  // For the command itself
  const command = _[0];

  if (!domain) {
    domain = await promptWithInquirer("Enter subdomain (e.g. 'dev4' for 'dev4.prolibu.com'):");
  }

  if (!collection) {
    collection = (await promptWithInquirer('Enter the collection name:')).toLowerCase();
  }

  if (!format) {
    format = await promptWithInquirer('Choose the format of the data:', 'list', ['csv', 'json', 'xlsx']);
  }

  return {
    domain,
    collection,
    format,
    _: [command],
  };
}

module.exports = getArguments;
