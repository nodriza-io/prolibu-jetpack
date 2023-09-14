const axios = require('axios');
const fileSystem = require('fs');
const path = require('path');
const Papa = require('papaparse');
const ExcelJS = require('exceljs');

async function importData(domain, collection, format) {
    const completeDomain = `${domain}.prolibu.com`;
    const configDirectory = path.join(__dirname, '..', 'accounts', domain);

    if (!fileSystem.existsSync(path.join(configDirectory, 'profile.json'))) {
        console.error(`No credentials found for domain ${completeDomain}. Please sign in first.`);
        return;
    }

    const profile = JSON.parse(fileSystem.readFileSync(path.join(configDirectory, 'profile.json'), 'utf8'));

    let currentPage = 1;
    let lastPage = 1;
    let allData = [];

    const startTime = Date.now();
    const outputFormat = (format === 'csv' || format === 'xlsx') ? 'csv' : 'json';
    const populate = (format === 'json') ? '&populate=*' : '';

    do {
        try {
            const url = `https://${completeDomain}/v2/${collection}?format=${outputFormat}&exportData=true&limit=250&page=${currentPage}${populate}`;
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
                parsedData = Papa.parse(response.data, { header: true }).data;
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

    const savePath = path.join(configDirectory, 'data', collection, format, `${collection}.${format.toLowerCase()}`);
    fileSystem.mkdirSync(path.dirname(savePath), { recursive: true });

    if (format === 'csv' || format === 'xlsx') {
        if (collection === 'template') {
            allData.forEach(record => {
                if (record.body && record.keyname) {
                    let htmlSavePath;
                    if (record.templateType) {
                        const sanitizedTemplateType = record.templateType.toLowerCase().split(' ').join('-');
                        htmlSavePath = path.join(configDirectory, 'data', collection, 'html', sanitizedTemplateType, `${record.keyname}.hbs`);
                    } else {
                        htmlSavePath = path.join(configDirectory, 'data', collection, 'html', `${record.keyname}.hbs`);
                    }
                    fileSystem.mkdirSync(path.dirname(htmlSavePath), { recursive: true });
                    fileSystem.writeFileSync(htmlSavePath, record.body);

                    // Check for jsonData and save it as a JSON file if present
                    if (record.jsonData) {
                        const jsonDataSavePath = path.join(path.dirname(htmlSavePath), `${record.keyname}.json`);
                        fileSystem.writeFileSync(jsonDataSavePath, record.jsonData);
                    }
                }
            });
        }

        if (format === 'csv') {
            const csvData = Papa.unparse(allData);
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
}

module.exports = importData;
