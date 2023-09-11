const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const readline = require('readline');
const cliProgress = require('cli-progress');

const CHUNK_SIZE = 100; // number of lines

async function uploadChunk(url, chunkContent, apiKey) {
  const formData = new FormData();

  formData.append('file', Buffer.from(chunkContent), {
    contentType: 'text/csv',
    filename: 'chunk.csv',
  });

  try {
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const { created, updated, errors } = response.data;
    return { created: created.length, updated: updated.length, errors };
  } catch (error) {
    console.error('Error while uploading chunk:', error.message);
    if (error.response) {
      console.error('Server Response:', error.response.data);
    }
    return { created: 0, updated: 0, errors: [] };
  }
}

async function uploadFile(domain, modelName, filepath, apiKey) {
  const url = `https://${domain}.prolibu.com/v2/service/importdata/${modelName}`;
  console.log(`Uploading to URL: ${url}`);

  if (!filepath.endsWith('.csv')) {
    console.error('Only CSV format supported for chunked uploads.');
    return;
  }

  const totalLines = (fs.readFileSync(filepath, 'utf-8').match(/\n/g) || []).length;
  const totalChunks = Math.ceil(totalLines / CHUNK_SIZE);

  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |{bar}| {percentage}% || Records: {importedRecords}/{totalRecords} || Chunks: {value}/{total} || Created: {createdCount} || Updated: {updatedCount} || Errors: {errorsCount}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  let importedRecords = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let errorsCount = 0; // Added errors count
  const errorLogs = [];

  progressBar.start(totalChunks, 0, {
    importedRecords, totalRecords: totalLines - 1, createdCount, updatedCount, errorsCount,
  });

  const rl = readline.createInterface({
    input: fs.createReadStream(filepath),
    crlfDelay: Infinity,
  });

  let headers = '';
  let chunkLines = [];
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 1) {
      headers = `${line}\n`;
      continue;
    }

    chunkLines.push(line);

    if (chunkLines.length === CHUNK_SIZE) {
      const chunkContent = headers + chunkLines.join('\n');
      const result = await uploadChunk(url, chunkContent, apiKey);
      importedRecords += result.created + result.updated;
      createdCount += result.created;
      updatedCount += result.updated;
      errorsCount += result.errors.length; // Updated errors count
      if (result.errors && result.errors.length) {
        errorLogs.push(...result.errors);
      }
      progressBar.update(progressBar.value + 1, {
        importedRecords, createdCount, updatedCount, errorsCount,
      });
      chunkLines = []; // reset chunk lines
    }
  }

  // Upload any remaining lines
  if (chunkLines.length > 0) {
    const chunkContent = headers + chunkLines.join('\n');
    const result = await uploadChunk(url, chunkContent, apiKey);
    importedRecords += result.created + result.updated;
    createdCount += result.created;
    updatedCount += result.updated;
    errorsCount += result.errors.length; // Updated errors count
    if (result.errors && result.errors.length) {
      errorLogs.push(...result.errors);
    }
    progressBar.update(progressBar.value + 1, {
      importedRecords, createdCount, updatedCount, errorsCount,
    });
  }

  progressBar.stop();
  console.log('File upload completed.');

  if (errorLogs.length > 0) {
    console.error('Errors encountered:', JSON.stringify(errorLogs, null, 4));
  }
}

async function exportData() {
  const inquirer = (await import('inquirer')).default;
  inquirer.registerPrompt('autocomplete', (await import('inquirer-autocomplete-prompt')).default);

  const { domain } = await inquirer.prompt({
    type: 'input',
    name: 'domain',
    message: "Enter subdomain (e.g. 'dev4' for 'dev4.prolibu.com'):",
  });

  const configDir = path.join(__dirname, '..', 'accounts', domain);
  if (!fs.existsSync(path.join(configDir, 'profile.json'))) {
    console.error(`No credentials found for domain ${domain}. Please sign in first.`);
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

  // Modification to fit the new directory structure
  const filePath = path.join(configDir, 'data', collection, format, `${collection}.${format}`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at ${filePath}.`);
    return;
  }

  const { apiKey } = profile; // Retrieving apiKey from profile.json
  await uploadFile(domain, collection, filePath, apiKey);
}

module.exports = exportData;
