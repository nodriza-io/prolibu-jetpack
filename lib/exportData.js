/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-loop-func */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const xlsx = require('xlsx');
const colors = require('colors');
const Papa = require('papaparse');

const CHUNK_SIZE = 100;

function readFileContent(filePath) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
    }
    console.error(`File not found at ${filePath}. Using empty string as fallback.`);
    return '';
}

async function uploadChunk(url, chunkContent, apiKey) {
    const formData = new FormData();
    formData.append('file', Buffer.from(chunkContent), { filename: 'chunk.json' });

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

function logErrorDetails(result, currentChunk) {
    result.errors.forEach((errorDetail) => {
        const errorLine = (currentChunk * CHUNK_SIZE) + (errorDetail.row + 2);
        console.error(`[${errorDetail.type === 'create' ? 'Create' : 'Update'} Error - @Row ${errorLine}] Code ${errorDetail.statusCode} -> ${JSON.stringify(errorDetail.error)}`.red);
    });
}

async function processChunk(url, chunkRecords, apiKey, currentChunk, totalChunks) {
    const chunkContent = JSON.stringify(chunkRecords);
    const result = await uploadChunk(url, chunkContent, apiKey);

    const cumulative = {
        created: result.created,
        updated: result.updated,
        errors: result.errors.length
    };

    if (result.errors.length) logErrorDetails(result, currentChunk);

    currentChunk++;
    const progressPercentage = ((currentChunk / totalChunks) * 100).toFixed(2);
    console.log(`[ Chunk ${currentChunk}/${totalChunks} - ${progressPercentage}% ] Created: ${cumulative.created} | Updated: ${cumulative.updated} | Errors: ${cumulative.errors}`);

    return { currentChunk, result };
}

async function uploadFile(domain, modelName, filepath, apiKey) {
  const startTime = Date.now();
  const url = `https://${domain}.prolibu.com/v2/service/importdata/${modelName}`;

  let records;

  const fileDirectory = path.dirname(filepath);

  if (filepath.endsWith('.xlsx')) {
      const workbook = xlsx.readFile(filepath);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      records = xlsx.utils.sheet_to_json(worksheet);
  } else {
      const csvData = fs.readFileSync(filepath, 'utf8');
      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
      records = parsed.data;
  }

  if (modelName === 'template') {
    for (let record of records) {
        if (record.body) {
            const relativePath = record.body.startsWith("../") ? record.body.slice(3) : record.body;
            // Join the basePath (i.e., path where the xlsx file resides) with the relativePath to form the full path
            const bodyFilePath = path.join(__dirname, '..', relativePath);
            record.body = readFileContent(bodyFilePath);
        }
        if (record.jsonData) {
            const relativeJsonPath = record.jsonData.startsWith("../") ? record.jsonData.slice(3) : record.jsonData;
            const jsonDataFilePath = path.join(__dirname, '..', relativeJsonPath);
            record.jsonData = readFileContent(jsonDataFilePath);
        }
    }
}
  

    const totalRecords = records.length;
    const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

    let currentChunk = 0;
    for (let i = 0; i < totalRecords; i += CHUNK_SIZE) {
        const chunkRecords = records.slice(i, i + CHUNK_SIZE);
        await processChunk(url, chunkRecords, apiKey, currentChunk, totalChunks);
        currentChunk++;
    }

    console.log('\nExport completed.');
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total time taken: ${totalTime}s`);
}

async function exportData(domain, collection, format) {
  const configDirectory = path.join(__dirname, '..', 'accounts', domain);

  if (!fs.existsSync(path.join(configDirectory, 'profile.json'))) {
    console.error(`No credentials found for domain ${domain}. Please sign in first.`);
    return;
  }

  const profile = JSON.parse(fs.readFileSync(path.join(configDirectory, 'profile.json'), 'utf8'));

  const filePath = path.join(configDirectory, 'data', collection, format, `${collection}.${format}`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at ${filePath}.`);
    return;
  }

  const { apiKey } = profile;
  await uploadFile(domain, collection, filePath, apiKey);
}


async function autoExportData(filepath) {
  const pathSegments = filepath.split(path.sep);

  const jetpackIndex = pathSegments.indexOf('jetpack');
  if (jetpackIndex === -1 || jetpackIndex >= pathSegments.length - 2) {
    console.error('The provided filepath does not have a valid "jetpack" segment.');
    return;
  }

  const domain = pathSegments[jetpackIndex + 1];

  const dataIndex = pathSegments.indexOf('data');
  if (dataIndex === -1 || dataIndex >= pathSegments.length - 1) {
    console.error('The provided filepath does not have a valid "data" segment.');
    return;
  }

  const collection = pathSegments[dataIndex + 1];

  const format = path.extname(filepath).slice(1);

  const configDirectory = path.join(__dirname, '..', 'accounts', domain);

  if (!fs.existsSync(path.join(configDirectory, 'profile.json'))) {
    console.error(`No credentials found for domain ${domain}. Please sign in first.`);
    return;
  }

  const profile = JSON.parse(fs.readFileSync(path.join(configDirectory, 'profile.json'), 'utf8'));
  const { apiKey } = profile;

  if (!fs.existsSync(filepath)) {
    console.error(`File not found at ${filepath}.`);
    return;
  }

  const changesPath = path.join(path.dirname(filepath), `changes.${format}`);
  await uploadFile(domain, collection, changesPath, apiKey);
}

module.exports = {
  exportData,
  autoExportData,
};
