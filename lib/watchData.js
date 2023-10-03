const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const { autoExportData } = require('./exportData');
const colors = require('colors');

async function extractChanges(originalFilePath, mirroredFilePath) {
  const originalData = fs.readFileSync(originalFilePath, 'utf8');
  const mirroredData = fs.existsSync(mirroredFilePath) ? fs.readFileSync(mirroredFilePath, 'utf8') : '';

  const originalRows = Papa.parse(originalData, { header: true }).data;
  const mirroredRows = Papa.parse(mirroredData, { header: true }).data;

  const changes = [];

  originalRows.forEach((row) => {
    if (!mirroredRows.some((mirroredRow) => JSON.stringify(mirroredRow) === JSON.stringify(row))) {
      changes.push(row);
    }
  });

  if (changes.length) {
    const changesPath = path.join(path.dirname(mirroredFilePath), 'changes.csv');
    const csvChanges = Papa.unparse(changes);
    fs.writeFileSync(changesPath, csvChanges);
    return changesPath;
  }
  return null;
}

async function identifyChanges(filePath, mirroredPath) {
  const changesPath = await extractChanges(filePath, mirroredPath);
  console.log('\n...changes detected, preparing to export.\n'.blue);
  if (changesPath) {
    await autoExportData(changesPath);
  }

  // Update the mirrored file after successful export
  fs.copyFileSync(filePath, mirroredPath);
}

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

async function convertExcelToCSV(excelPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  // Derive the new CSV path within /tmp/jetpack
  const relativePathFromAccounts = path.relative(path.join(__dirname, '..', 'accounts'), excelPath);
  const csvPath = path.join('/tmp/jetpack', relativePathFromAccounts).replace('.xlsx', '.csv');

  ensureDirectoryExistence(csvPath); // Ensure the directory exists before writing

  const csvStream = fs.createWriteStream(csvPath);
  await workbook.csv.write(csvStream);
  return csvPath;
}

function watchData(domain, collection, format) {
  const accountsDir = path.join(__dirname, '..', 'accounts', domain, 'data', collection, format, `${collection}.${format}`);
  const mirroredDir = path.join('/tmp/jetpack', domain, 'data', collection, format, `${collection}.${format}`);
  if (!fs.existsSync(accountsDir)) {
    throw new Error(`Error: The path does not exist: "${accountsDir}"`.red);
  }
  // Before starting the watcher, delete any existing changes.csv or converted CSV files from XLSX.
  const changesFilePath = path.join(path.dirname(mirroredDir), 'changes.csv');
  const mirroredCSVPath = mirroredDir.replace('.xlsx', '.xlsx.csv');

  if (fs.existsSync(changesFilePath)) {
    fs.unlinkSync(changesFilePath);
  }

  if (fs.existsSync(mirroredCSVPath)) {
    fs.unlinkSync(mirroredCSVPath);
  }

  const watcher = chokidar.watch(accountsDir, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (filePath) => {
    const mirroredPath = path.join(mirroredDir, path.relative(accountsDir, filePath));

    ensureDirectoryExistence(mirroredPath);

    if (format === 'csv') {
      identifyChanges(filePath, mirroredPath);
    } else if (format === 'xlsx') {
      const csvFilePath = await convertExcelToCSV(filePath);
      const mirroredCSVPath = mirroredPath.replace('.xlsx', '.xlsx.csv');

      identifyChanges(csvFilePath, mirroredCSVPath);
    }
  });

  console.log(`Watching for changes in ${accountsDir}...`);
}

module.exports = watchData;
