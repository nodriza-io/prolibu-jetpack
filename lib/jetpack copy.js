// const inquirer = require('inquirer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const watch = require('fs').watch;
const FormData = require('form-data');

const argv = yargs(hideBin(process.argv))
  .command('signin <domain>', 'Sign in to a domain', (yargs) => {
    yargs.positional('domain', {
      describe: 'Domain to sign in to',
      type: 'string'
    })
    .option('email', {
      alias: 'e',
      describe: 'Email for signin',
      type: 'string',
      demandOption: true
    });
  })
  .command('import <domain>', 'Import data from a domain', (yargs) => {
    yargs.positional('domain', {
      describe: 'Domain to import data from',
      type: 'string'
    })
    .option('collection', {
      describe: 'Collection to import',
      type: 'string',
      demandOption: true
    })
    .option('format', {
      describe: 'Format of data',
      type: 'string',
      demandOption: true
    });
  })
  .help('h')
  .alias('h', 'help')
  .argv;

async function signIn(domain, email) {
  const inquirer = (await import('inquirer')).default;
  const { password } = await inquirer.prompt([{
    type: "password",
    name: "password",
    message: "Enter password:"
  }]);

  try {
    const response = await axios.post(
      `https://${domain}/v2/auth/signin`,
      {
        email,
        password
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (response.data && response.data.apiKey) {
      const configDir = path.join(__dirname, "accounts", domain);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, "config.js"),
        `exports.apiKey = "${response.data.apiKey}";`
      );
      console.log("Sign in successful!");
    } else {
      console.log("Invalid response from server");
    }
  } catch (error) {
    console.error("Error signing in:", error.response ? error.response.data : error.message);
  }
}

function startWatching() {
  const accountsDir = path.join(__dirname, "accounts");
  const watcher = watch(accountsDir, { recursive: true });

  watcher.on('change', (eventType, filename) => {
      if (eventType !== 'change' || !filename) return;

      // Get the absolute path of the changed file
      const absoluteFilePath = path.resolve(accountsDir, filename);
      console.log(`File changed: ${absoluteFilePath}`);

      // Split the absolute path to get individual folder names and file names
      const pathParts = absoluteFilePath.split(path.sep);
      
      // The domain is now 3 directories above the file
      const domain = pathParts[pathParts.length - 4];
      const modelName = pathParts[pathParts.length - 1].replace('.csv', '').replace('.xlsx', '');

      uploadFile(domain, modelName, absoluteFilePath);
  });
}
async function uploadFile(domain, modelName, filepath) {
  const url = `https://${domain}/v2/service/importdata/${modelName}`;

  // Retrieve API key from the respective config file
  const configPath = path.join(__dirname, "accounts", domain, "config.js");
  if (!fs.existsSync(configPath)) {
      console.error(`Config not found for domain: ${domain}`);
      return;
  }

  const configModule = require(configPath);
  const { apiKey } = configModule;

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filepath));

  try {
      const response = await axios.post(url, formData, {
          headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${apiKey}`
          }
      });
      const { created, updated, errors } = response.data;
      if (errors.length) {
        console.error(JSON.stringify(errors, null, 4));
      }
      // console.log('--------> updated:', updated)
      console.log('File uploaded successfully:', `Created: (${created.length}) Updated: (${updated.length}) errors: (${errors.length})`);
  } catch (error) {
      console.error(`Error uploading ${modelName} file to domain ${domain}:`, error.message);
  }
}

async function dataImport(domain, collection, format) {
  const configPath = path.join(__dirname, "accounts", domain, "config.js");
  if (!fs.existsSync(configPath)) {
    console.error("You should sign in first");
    return;
  }

  const configModule = require(configPath);
  const { apiKey } = configModule;

  try {
    const response = await axios.get(
      `https://${domain}/v2/${collection}/?exportData=true&format=${format}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const dataDir = path.join(__dirname, "accounts", domain, "data", collection);
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, `${collection}.${format}`), response.data);
    console.log("Data import successful!");
  } catch (error) {
    console.error("Error importing data:", error.message);
  }
}

if (argv._[0] === 'signin') {
  signIn(argv.domain, argv.email);
} else if (argv._[0] === 'import') {
  dataImport(argv.domain, argv.collection, argv.format);
} else if (argv._[0] === 'watch') {
  startWatching();
} else {
  console.error('Invalid command. For help, visit https://github.com/nodriza-io/jetpack/blob/main/README.md');
}