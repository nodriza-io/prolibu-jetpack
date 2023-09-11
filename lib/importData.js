/* eslint-disable no-await-in-loop */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const cliProgress = require('cli-progress');

async function importData() {
  const inquirer = (await import('inquirer')).default;
  inquirer.registerPrompt('autocomplete', (await import('inquirer-autocomplete-prompt')).default);
  
  const { domain } = await inquirer.prompt({
    type: 'input',
    name: 'domain',
    message: "Enter subdomain (e.g. 'dev4' for 'dev4.prolibu.com'):",
  });

  const fullDomain = `${domain}.prolibu.com`;

  const configDir = path.join(__dirname, '..', 'accounts', domain);
  if (!fs.existsSync(path.join(configDir, 'profile.json'))) {
    console.error(`No credentials found for domain ${fullDomain}. Please sign in first.`);
    return;
  }

  const profile = JSON.parse(fs.readFileSync(path.join(configDir, 'profile.json'), 'utf8'));
  const availableSchemas = Object.keys(profile.me.ui.schemas);

  const { collection } = await inquirer.prompt({
    type: 'autocomplete', // change 'list' to 'autocomplete'
    name: 'collection',
    message: 'Choose the collection to import:',
    source(answersSoFar, input) {
      // if there's no input, show all choices
      input = input || '';
      return new Promise((resolve) => {
        resolve(availableSchemas.filter((schema) => schema.toLowerCase().includes(input.toLowerCase())));
      });
    },
  });

  const { format } = await inquirer.prompt({
    type: 'list',
    name: 'format',
    message: 'Choose the format of the data:',
    choices: ['csv', 'json'],
  });

  let currentPage = 1;
  let lastPage = 1;
  let allData = [];
  let totalRecords = 0;

  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |' + '{bar}' + '| {percentage}% || {value}/{total} Pages || Elapsed time: {elapsedTime}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  progressBar.start(1, 0);

  const startTime = Date.now();

  do {
    try {
      const response = await axios.get(
        `https://${fullDomain}/v2/${collection}?format=${format}&exportData=true&limit=250&page=${currentPage}`,
        {
          headers: {
            Accept: format === 'json' ? 'application/json' : 'text/csv',
            Authorization: `Bearer ${profile.apiKey}`,
          },
        },
      );

      if (response.headers && response.headers['x-pagination']) {
        const pagination = JSON.parse(response.headers['x-pagination']);
        lastPage = pagination.lastPage || 1;
      }

      progressBar.setTotal(lastPage);
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      progressBar.update(currentPage, { elapsedTime });

      if (format === 'csv') {
        const parsedData = Papa.parse(response.data, { header: true }).data;
        totalRecords += parsedData.length;
        if (currentPage !== 1) parsedData.shift();
        allData = allData.concat(parsedData);
      } else {
        allData.push(...response.data);
        totalRecords += response.data.length;
      }

      currentPage++;
    } catch (error) {
      console.error('Error importing data:', error.response ? error.response.data : error.message);
      break;
    }
  } while (currentPage <= lastPage);

  progressBar.stop();

  // Modified savePath to match the new directory structure
  const savePath = path.join(configDir, 'data', collection, format, `${collection}.${format.toLowerCase()}`);
  fs.mkdirSync(path.dirname(savePath), { recursive: true });

  if (format === 'csv') {
    const csvData = Papa.unparse(allData);
    fs.writeFileSync(savePath, csvData);
  } else {
    fs.writeFileSync(savePath, JSON.stringify(allData, null, 2));
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`${totalRecords} records imported to ${savePath}`);
  console.log(`Total time taken: ${totalTime}s`);
}

module.exports = importData;
