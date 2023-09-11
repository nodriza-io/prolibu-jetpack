const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const Papa = require('papaparse');
const { autoExportData } = require('./exportData');

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

  // Write changes to changes.csv in the mirrored directory
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

function watchData() {
  const accountsDir = path.join(__dirname, '..', 'accounts');
  const mirroredDir = path.join('/tmp/jetpack/accounts');

  const watcher = chokidar.watch(accountsDir, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', (filePath) => {
    const fileExtension = path.extname(filePath);
    if (fileExtension === '.csv' || fileExtension === '.json') {
      const mirroredPath = path.join(mirroredDir, path.relative(accountsDir, filePath));

      // Ensure that the directory structure exists
      ensureDirectoryExistence(mirroredPath);

      // Identify changes and export data
      identifyChanges(filePath, mirroredPath);
    }
  });

  console.log(`Watching for changes in ${accountsDir}...`);
}

module.exports = watchData;
