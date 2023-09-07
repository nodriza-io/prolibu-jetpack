const vscode = require('vscode');
const chokidar = require('chokidar');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Papa = require('papaparse');
const { promisify } = require('util');

// async function convertXLSXToCSV(xlsxPath, csvPath) {
// 	return new Promise((resolve, reject) => {
// 	  try {
// 		const workbook = XLSX.readFile(xlsxPath);
// 		const sheet = workbook.Sheets[workbook.SheetNames[0]];
// 		const csvData = XLSX.utils.sheet_to_csv(sheet);
// 		fs.writeFileSync(csvPath, csvData);
// 		resolve();
// 	  } catch (error) {
// 		reject(error);
// 	  }
// 	});
//   }

// async function convertXLSXToCSV(xlsxPath, csvPath) {
// 	return new Promise((resolve, reject) => {
// 	  try {
// 		// Asegúrate de que el archivo existe y tiene un tamaño > 0
// 		if (fs.existsSync(xlsxPath) && fs.statSync(xlsxPath).size > 0) {
// 		  console.log(`Convirtiendo archivo XLSX ${xlsxPath} a CSV ${csvPath}`);
// 		  const workbook = XLSX.readFile(xlsxPath);
// 		  const sheet = workbook.Sheets[workbook.SheetNames[0]];
// 		  const csvData = XLSX.utils.sheet_to_csv(sheet);

// 		  try {
// 			fs.writeFileSync(csvPath, csvData);
// 			console.log(`Archivo CSV creado exitosamente en ${csvPath}`);
// 			resolve();
// 		  } catch (writeErr) {
// 			console.error(`Error al escribir el archivo CSV: ${writeErr}`);
// 			reject(writeErr);
// 		  }
// 		} else {
// 		  reject(new Error('Archivo no encontrado o está vacío.'));
// 		}
// 	  } catch (error) {
// 		console.error(`Error al convertir XLSX a CSV: ${error}`);
// 		reject(error);
// 	  }
// 	});
//   }



  
  async function convertXLSXToCSV(xlsxPath, csvPath) {
	return new Promise((resolve, reject) => {
	  try {
		if (fs.existsSync(xlsxPath) && fs.statSync(xlsxPath).size > 0) {
		  const workbook = XLSX.readFile(xlsxPath);
		  const sheetName = workbook.SheetNames[0];
		  const sheet = workbook.Sheets[sheetName];
  
		  // Recorre las celdas para encontrar fechas y convertirlas
		  Object.keys(sheet).forEach((key) => {
			if (key[0] !== '!') { // Ignora las propiedades meta como '!ref'
			  const cell = sheet[key];
			  if (cell.t === 'n' && cell.w) { // Chequea si es un número (t='n') y tiene un valor en string (w)
				// Aquí es donde identificas y conviertes las fechas, puedes ajustar este bloque según tu caso de uso
				// Asumiendo que el número es una fecha de Excel
				const date = XLSX.SSF.parse_date_code(cell.v);
				if (date) {
				  const isoString = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S)).toISOString();
				  cell.t = 's'; // Cambia el tipo a string
				  cell.v = isoString; // Asigna el nuevo valor
				  cell.w = isoString; // Actualiza el valor en string también
				}
			  }
			}
		  });
  
		  // Guarda el archivo CSV
		  XLSX.writeFile(workbook, csvPath, { bookType: 'csv' });
		  resolve();
		} else {
		  reject(new Error('Archivo no encontrado o está vacío.'));
		}
	  } catch (error) {
		reject(error);
	  }
	});
  }
  
  
  
  
  


function activate(context) {

	let startDisposable = vscode.commands.registerCommand('extension.start', function () {
		const terminal = vscode.window.createTerminal('Mi Terminal');
		terminal.show();
	});

	let disposable = vscode.commands.registerCommand(
		"extension.abrirCsv",
		function () {
			const terminal = vscode.window.createTerminal("Prolibu");
			terminal.show();
			const cliPath = path.join(__dirname, 'cli.js');
			terminal.sendText(`alias prolibu="node ${cliPath}"`);
		}
	);
	

	// async function convertXlsxToCsv(xlsxPath, csvPath) {
	// 	const workbook = new ExcelJS.Workbook();
	// 	await workbook.xlsx.readFile(xlsxPath);
	// 	const worksheet = workbook.worksheets[0];
	// 	let csvContent = '';

	// 	worksheet.eachRow({ includeEmpty: true }, (row) => {
	// 	  let rowValues = row.values.slice(1);  // Elimina el primer elemento vacío
	// 	  csvContent += rowValues.join(',') + '\n';
	// 	});

	// 	fs.writeFileSync(csvPath, csvContent);
	//   }

	const accountsDir = path.join(__dirname, 'accounts');

	const watcher = chokidar.watch(accountsDir, {
		ignored: [/(^|[\/\\])\../, /^\.~lock\./, /\.json$/],
		persistent: true
	});

	watcher.on('add', async (newFilePath) => {
		const fileExtension = path.extname(newFilePath);

		// Asegúrate de que solo estás trabajando con archivos .xlsx
		if (fileExtension === '.xlsx') {
			console.log(`Nuevo archivo añadido: ${newFilePath}`);

			const fileName = path.basename(newFilePath); // Obtener el nombre del archivo sin la ruta completa
			const backupPath = path.join(path.dirname(newFilePath), '.data', fileName); // Ruta para la copia de seguridad

			fs.copyFile(newFilePath, backupPath, async (err) => {
				if (err) throw err;
				console.log(`Archivo original copiado para respaldo como ${backupPath}.`);

				// Crear el nombre del archivo CSV temporal basado en el nombre original
				const csvFileName = fileName.replace('.xlsx', '_original.csv');
				const csvBackupPath = path.join(path.dirname(backupPath), csvFileName);

				await convertXLSXToCSV(backupPath, csvBackupPath); // Asume que ya tienes una función para hacer esta conversión
				console.log(`Archivo copia convertido a CSV como ${csvBackupPath}.`);
			});
		}
	});


	let debounceTimeout;

	watcher.on('change', async (changedPath) => {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			console.log(`Archivo modificado: ${changedPath}`);
			let modifiedRows = {}; // Ahora es un objeto

			const originalFileName = path.basename(changedPath, '.xlsx');
			//const uniqueFileName = changedPath;
			// Obtiene el nombre del archivo con la extensión
			const fileNameWithExtension = path.basename(changedPath);

			// Quita la extensión
			const fileNameWithoutExtension = fileNameWithExtension.replace(path.extname(fileNameWithExtension), '');
			modifiedRows[fileNameWithoutExtension] = modifiedRows[fileNameWithoutExtension] || [];
			const copyOriginalCSVPath = path.join(path.dirname(changedPath), '.data', `${originalFileName}_original.csv`);
			console.log(`Archivo original copiado: ${copyOriginalCSVPath}`);

			const backupCSVPath = path.join(path.dirname(changedPath), '.data', `${originalFileName}_backup.csv`);
			console.log(`Archivo backupCSVPath change: ${backupCSVPath}`);

			await convertXLSXToCSV(changedPath, backupCSVPath);

			const backupCSV = fs.readFileSync(backupCSVPath, 'utf8');
			console.log(`Archivo backupCSV: ${backupCSV}`);
			const originalCopyCSV = fs.readFileSync(copyOriginalCSVPath, 'utf8');
			console.log(`Archivo originalCopyCSV: ${originalCopyCSV}`);
			const backupRows = Papa.parse(backupCSV, { header: true }).data;
			const originalRows = Papa.parse(originalCopyCSV, { header: true }).data;
		
			for (let i = 0; i < backupRows.length; i++) {
				const backupRow = backupRows[i];
				const tempRow = originalRows[i];
				if (!backupRow || !tempRow) {
					continue; // saltar a la siguiente iteración
				  }
				  
				let rowChanged = false;

				for (const [key, value] of Object.entries(backupRow)) {
					if (value !== tempRow[key]) {
						rowChanged = true;
						break; // Rompe el ciclo tan pronto como encuentres un valor cambiado
					}
				}
				if (rowChanged) {
					if (tempRow.hasOwnProperty('_id') && tempRow['_id']) {
						// Si la fila tiene un _id y este _id no es vacío, añade toda la fila
						modifiedRows[fileNameWithoutExtension].push(tempRow);
					} else {
						// Si la fila no tiene un _id o es vacío, añade sólo las columnas que tienen datos
						const filteredRow = {};
						for (const [key, value] of Object.entries(tempRow)) {
							if (value) {
								filteredRow[key] = value;
							}
						}
						modifiedRows[fileNameWithoutExtension].push(filteredRow);
						console.log('tempRow antes de modificar:', JSON.stringify(tempRow, null, 2));
						console.log('filteredRow antes de modificar:', JSON.stringify(filteredRow, null, 2));
						// ... tu código de modificación aquí ...
						console.log('modifiedRows después de modificar:', JSON.stringify(modifiedRows, null, 2));

					}
					
					console.log(`Fila modificada: ${JSON.stringify(tempRow)}`);
				}
				
				
				// if (rowChanged) {
				// 	modifiedRows[fileNameWithoutExtension].push(tempRow);
				// 	console.log(`Fila modificada: ${JSON.stringify(tempRow)}`);
				// }
			}
			// const copyFileAsync = promisify(fs.copyFile);
			// await copyFileAsync(backupCSVPath, copyOriginalCSVPath);
			// try {
			// 	await copyFileAsync(backupCSVPath, copyOriginalCSVPath);
			// 	console.log(`Archivo de respaldo copiado correctamente a ${copyOriginalCSVPath}.`);
			// } catch (err) {
			// 	console.error(`Error al copiar el archivo: ${err}`);
			// }


			// Guarda las filas modificadas en un archivo temporal
			const directoryOfChangedFile = path.dirname(changedPath);
			console.log(`Guardando filas modificadas en ${directoryOfChangedFile}`);
			const jsonFileName = "data.json";

			// Finalmente, creo la ruta completa para el nuevo archivo JSON.
			const fullPathToJsonFile = path.join(directoryOfChangedFile, jsonFileName);
			
			// Guarda las filas modificadas en el archivo JSON en el mismo directorio que el archivo XLSX.
			console.log(`Guardando filas modificadas en ${fullPathToJsonFile}`);
			console.log('objeto---', JSON.stringify(modifiedRows, null, 2));

			fs.writeFileSync(fullPathToJsonFile, JSON.stringify(modifiedRows));


			
		}, 300); // Tiempo de espera de 300 ms
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(startDisposable);

}
exports.activate = activate;
