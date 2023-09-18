const axios = require('axios');
const fileSystem = require('fs');
const path = require('path');
const PapaParse = require('papaparse');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { downloadAssets } = require('./figma');

async function importData(domain, collection, format, query = 'select=-createdBy -updatedBy -createdAt -updatedAt') {
  let open;
  import('open').then((module) => open = module.default);
  console.log(`\n...preparing to import ${collection}.${format} to ${domain}.prolibu.com\n`.blue);
  const completeDomain = `${domain}.prolibu.com`;
  const configurationDirectory = path.join(__dirname, '..', 'accounts', domain);

  if (!fileSystem.existsSync(path.join(configurationDirectory, 'profile.json'))) {
    console.error(`No credentials found for domain ${completeDomain}. Please sign in first.`);
    return;
  }

  const profile = JSON.parse(fileSystem.readFileSync(path.join(configurationDirectory, 'profile.json'), 'utf8'));

  let currentPage = 1;
  let lastPage = 1;
  let allData = [];

  const startTime = Date.now();
  const outputFormat = (format === 'csv' || format === 'xlsx') ? 'csv' : 'json';

  do {
    try {
      const url = `https://${completeDomain}/v2/${collection}?format=${outputFormat}&exportData=true&limit=250&page=${currentPage}&${query}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${profile.apiKey}`,
        },
      });

      if (response.headers && response.headers['x-pagination']) {
        const pagination = JSON.parse(response.headers['x-pagination']);
        lastPage = pagination.lastPage || 1;
      }

      let parsedData;
      if (format === 'csv' || format === 'xlsx') {
        parsedData = PapaParse.parse(response.data, { header: true }).data;
        if (currentPage !== 1 && parsedData[0] && parsedData[0] === Object.keys(allData[0])) {
          parsedData.shift();
        }
      } else if (format === 'json') {
        parsedData = response.data;
      } else {
        throw new Error(`Invalid format '${format}'`);
      }

      allData = allData.concat(parsedData);

      const percentComplete = ((currentPage / lastPage) * 100).toFixed(2);
      console.log(`[Page ${currentPage}/${lastPage} | ${percentComplete}%] Records Imported: ${allData.length}`);
      currentPage++;
    } catch (error) {
      console.error('Error importing data:', error.response ? error.response.data : error.message);
      break;
    }
  } while (currentPage <= lastPage);
  const savePath = path.join(configurationDirectory, 'data', collection, format, `${collection}.${format.toLowerCase()}`);
  fileSystem.mkdirSync(path.dirname(savePath), { recursive: true });

  if (format === 'csv' || format === 'xlsx') {
    if (collection === 'template') {
      allData.forEach(async (record) => {
        if (record.body && record.keyname) {
          const templateCategoryPath = record.templateType ? record.templateType.toLowerCase().split(' ').join('-') : '';
          const templateKeyPath = path.join(configurationDirectory, 'data', collection, 'html', templateCategoryPath, record.keyname);

          // Save the HTML content
          const htmlSavePath = path.join(templateKeyPath, `${record.keyname}.hbs`);
          fileSystem.mkdirSync(path.dirname(htmlSavePath), { recursive: true });
          fileSystem.writeFileSync(htmlSavePath, record.body);
          record.body = path.relative(__dirname, htmlSavePath);

          // Save the JSON content
          if (record.jsonData) {
            const jsonDataSavePath = path.join(templateKeyPath, `${record.keyname}.json`);
            fileSystem.writeFileSync(jsonDataSavePath, record.jsonData);
            record.jsonData = path.relative(__dirname, jsonDataSavePath);
          }

          // Download FIGMA images
          if (record.figmaFileId) {
            const imgFolderPath = path.join(templateKeyPath, 'img');
            if (!fs.existsSync(imgFolderPath)) {
              fs.mkdirSync(imgFolderPath, { recursive: true });
            }
            await downloadAssets(record.figmaFileId, templateKeyPath, record.keyname);
          }
        }
      });
    }

    if (format === 'csv') {
      const csvData = PapaParse.unparse(allData);
      fileSystem.writeFileSync(savePath, csvData);
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(collection);
      worksheet.columns = Object.keys(allData[0]).map((key) => ({ header: key, key }));
      worksheet.addRows(allData);
      await workbook.xlsx.writeFile(savePath);
    }
  } else {
    fileSystem.writeFileSync(savePath, JSON.stringify(allData, null, 2));
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nTotal Records Imported: ${allData.length}`);
  console.log(`Data saved to: ${savePath}`);
  console.log(`Total time taken: ${totalTime}s`);

  await open(savePath);
}

module.exports = importData;
