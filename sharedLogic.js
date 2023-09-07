const chokidar = require('chokidar');
const fs = require('fs');
const XLSX = require('xlsx');
const Papa = require('papaparse');

let modifiedRows = {};

async function convertXLSXToCSV(xlsxPath, csvPath) {
	console.log(`Convirtiendo convertXLSXToCSVV`);
	return new Promise((resolve, reject) => {
		try {
			if (fs.existsSync(xlsxPath) && fs.statSync(xlsxPath).size > 0) {
				const workbook = XLSX.readFile(xlsxPath);
				const sheet = workbook.Sheets[workbook.SheetNames[0]];

				let csvData = XLSX.utils.sheet_to_csv(sheet);

				// Reemplazar el formato de la fecha (esto es solo un ejemplo)
				csvData = csvData.replace(
					/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/g,
					(_, p1, p2, p3, p4, p5, p6) => `${p3}/${p2}/${p1} ${p4}:${p5}:${p6}`
				);

				// Reemplazar 'undefined' con ''
				csvData = csvData.replace(/undefined/g, '');

				fs.writeFileSync(csvPath, csvData);
				resolve();
			} else {
				reject(new Error('Archivo no encontrado o está vacío.'));
			}
		} catch (error) {
			reject(error);
		}
	});
}

async function handleFileChanges(changedPath) {
  // ... (tu código aquí)
}

module.exports = { modifiedRows, convertXLSXToCSV, handleFileChanges };
