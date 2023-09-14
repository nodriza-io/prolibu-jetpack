/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-loop-func */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const readline = require('readline');
const xlsx = require('xlsx');
const colors = require('colors');

const CHUNK_SIZE = 100;

async function uploadChunk(url, chunkContent, apiKey) {
    const formData = new FormData();
    formData.append('file', Buffer.from(chunkContent), {
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

function logErrorDetails(result, currentChunk) {
    result.errors.forEach((err) => {
        const errorLine = (currentChunk * CHUNK_SIZE) + (err.row + 2);
        console.error(`[${err.type === 'create' ? 'Create' : 'Update'} Error - @Row ${errorLine}] Code ${err.statusCode} -> ${JSON.stringify(err.error)}`.red);
    });
}

async function processChunk(url, headers, chunkLines, apiKey, currentChunk, totalChunks, lineNumber, cumulative, totalLines) {
    const chunkContent = headers + chunkLines.join('\n');
    const result = await uploadChunk(url, chunkContent, apiKey);

    cumulative.created += result.created;
    cumulative.updated += result.updated;
    cumulative.errors += result.errors.length;

    if (result.errors.length) logErrorDetails(result, currentChunk);

    currentChunk++;
    const progressPercentage = ((currentChunk / totalChunks) * 100).toFixed(2);
    console.log(`[ Chunk ${currentChunk}/${totalChunks} - ${progressPercentage}% ] ${lineNumber - 1} rows of ${totalLines} | Created: ${cumulative.created} | Updated: ${cumulative.updated} | Errors: ${cumulative.errors}`);

    return { currentChunk, result };
}

function escapeNewlinesInExcel(workbook) {
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const range = xlsx.utils.decode_range(sheet['!ref']); // Get the range of cells containing data

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = { c: C, r: R };
                const cellRef = xlsx.utils.encode_cell(cellAddress);
                const cell = sheet[cellRef];

                // If the cell exists and has a string value
                if (cell && cell.t === 's') {
                    cell.v = cell.v.replace(/\n/g, ' '); // replace newline with space
                    cell.w = undefined; // force reformatting the string in cell
                }
            }
        }
    }
}

async function uploadFile(domain, modelName, filepath, apiKey) {
    const startTime = Date.now();
    const url = `https://${domain}.prolibu.com/v2/service/importdata/${modelName}`;
    let tempPath = null;

    if (filepath.endsWith('.xlsx')) {
        const workbook = xlsx.readFile(filepath);
        
        // Escape newline characters in Excel before converting to CSV
        escapeNewlinesInExcel(workbook);
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvData = xlsx.utils.sheet_to_csv(worksheet);
        
        tempPath = `/tmp/jetpack/${Date.now()}.temp.csv`;
        fs.writeFileSync(tempPath, csvData, 'utf8');
        filepath = tempPath;
    }

    const totalLines = (fs.readFileSync(filepath, 'utf-8').match(/\n/g) || []).length;
    const totalChunks = Math.ceil((totalLines - 1) / CHUNK_SIZE);
    const readerInterface = readline.createInterface({
        input: fs.createReadStream(filepath),
        crlfDelay: Infinity,
    });

    let headers = '';
    let chunkLines = [];
    let lineNumber = 0;
    let currentChunk = 0;
    const cumulative = { created: 0, updated: 0, errors: 0 };

    for await (const line of readerInterface) {
        lineNumber++;

        if (lineNumber === 1) {
            headers = `${line}\n`;
            continue;
        }

        chunkLines.push(line);

        if (chunkLines.length === CHUNK_SIZE) {
            const { currentChunk: newChunk } = await processChunk(url, headers, chunkLines, apiKey, currentChunk, totalChunks, lineNumber, cumulative, totalLines);
            chunkLines = [];
            currentChunk = newChunk;
        }
    }

    if (chunkLines.length) {
        await processChunk(url, headers, chunkLines, apiKey, currentChunk, totalChunks, lineNumber, cumulative, totalLines);
    }

    console.log('\nExport completed.');
    console.log(`Rows Created: ${cumulative.created} | Updated: ${cumulative.updated} | Errors: ${cumulative.errors}`);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total time taken: ${totalTime}s`);
    if (tempPath) {
        fs.unlinkSync(tempPath);
    }
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
    if (dataIndex === -1 || dataIndex >= pathSegments.length - 2) {
        console.error('The provided filepath does not have a valid "data" segment.');
        return;
    }

    const collection = pathSegments[dataIndex + 1];
    const format = pathSegments[dataIndex + 2];

    await exportData(domain, collection, format);
}

module.exports = {
  exportData,
  autoExportData,
};
