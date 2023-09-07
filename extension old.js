const vscode = require("vscode");
const fs = require("fs");
const fsP = require('fs').promises;
const path = require("path");

async function activate(context) {
	const folderUris = await vscode.window.showOpenDialog({
		canSelectFolders: true,
		canSelectFiles: false,
		canSelectMany: false
	});
	console.log('folderUris---', folderUris)
	if (folderUris && folderUris.length > 0) {
		const config = vscode.workspace.getConfiguration('miExtension');
		config.update('rutaPrincipal', folderUris[0].fsPath, vscode.ConfigurationTarget.Global);
	}
	const config = vscode.workspace.getConfiguration('miExtension');
	const rutaPrincipal = config.get('rutaPrincipal');
	console.log('rutaPrincipal----', rutaPrincipal)
	fs.readdir(rutaPrincipal, (err, items) => {
		items.forEach(item => {
			const itemPath = path.join(rutaPrincipal, item);
			if (fs.statSync(itemPath).isDirectory()) {
				// Es una carpeta, puedes listar los archivos CSV dentro de esta carpeta
				fs.readdir(itemPath, (err, files) => {
					const csvFiles = files.filter(file => file.endsWith('.csv'));
					// Hacer algo con csvFiles
				});
			}
		});
	})

	let disposable = vscode.commands.registerCommand(
		"extension.abrirCsv",
		function () {
			const panel = vscode.window.createWebviewPanel(
				"csvViewer",
				"Visualizador de CSV",
				vscode.ViewColumn.One,
				{
					enableScripts: true,
				}
			);

			panel.webview.html = getWebviewContent();
			
			//panel.webview.postMessage({ command: 'actualizarLista', carpetas, csvFiles });

			panel.webview.onDidReceiveMessage(async (message) => {
				switch (message.command) {
					case "loadCsv":
						const options = {
							canSelectMany: false,
							openLabel: "Abrir",
							filters: {
								"CSV files": ["csv"],
							},
						};

						const fileUri = await vscode.window.showOpenDialog(options);
						//let fileContent;  // Almacenar el contenido anterior aquí

						if (fileUri && fileUri[0]) {
							const fileContent = fs.readFileSync(fileUri[0].fsPath, "utf8");
							console.log("fileUri[0]", fileUri[0].path);
							// Guardar el contenido en un archivo temporal
							/*const tempPath = path.join(__dirname, 'temp.csv');
							  fs.writeFileSync(tempPath, fileContent);
			  
							  const tempUri = vscode.Uri.file(tempPath);
							  */
							// Abrir el archivo en un nuevo editor de texto
							const document = await vscode.workspace.openTextDocument(
								fileUri[0]
							);
							//await vscode.window.showTextDocument(document, { preview: true });
							const tempEditor = await vscode.window.showTextDocument(document);

							//await vscode.window.showTextDocument(document);
							console.log("cargando archivo.---");

							setTimeout(async () => {
								await vscode.commands.executeCommand(
									"edit-csv.edit",
									fileUri[0]
								);

								// Cambiar el enfoque de nuevo al editor temporal
								vscode.window.showTextDocument(tempEditor.document).then(() => {
									// Cerrar el editor temporal
									vscode.commands.executeCommand(
										"workbench.action.closeActiveEditor"
									);
								});
							}, 1000);
							console.log(1)
							//   let previousContent = [];

							//   const watcher = fs.watch(fileUri[0].path, (eventType, filename) => {
							// 	if (filename) {
							// 	  fs.readFile(fileUri[0].path, "utf8", (err, newContent) => {
							// 		if (err) {
							// 		  console.error("Error leyendo el archivo:", err);
							// 		  return;
							// 		}
							// 		const newLines = newContent.split("\n");
							// 		let changes = [];

							// 		newLines.forEach((line, index) => {
							// 		  if (previousContent[index] !== line) {
							// 			changes.push({
							// 			  rowIndex: index,
							// 			  old: previousContent[index],
							// 			  new: line,
							// 			});
							// 		  }
							// 		});

							// 		if (changes.length > 0) {
							// 		  console.log("Filas cambiadas:", changes);
							// 		}

							// 		previousContent = newLines;
							// 	  });
							// 	}
							//   });
							let previousContent = [];

							const watcher = fs.watch(fileUri[0].path, (eventType, filename) => {
								if (filename) {
									fs.readFile(fileUri[0].path, "utf8", (err, newContent) => {
										if (err) {
											console.error("Error leyendo el archivo:", err);
											return;
										}
										const newLines = newContent.split("\n");
										let changes = [];

										newLines.forEach((line, index) => {
											if (previousContent[index] !== line) {
												// Convierte la línea en un objeto
												const cells = line.split(',');
												const rowObj = {
													field1: cells[0],
													field2: cells[1],
													// ... más campos aquí
												};

												changes.push({
													rowIndex: index,
													old: previousContent[index],
													new: rowObj,
												});
											}
										});

										if (changes.length > 0) {
											console.log("Filas cambiadas como objetos:", changes);
										}

										previousContent = newLines;
									});
								}
							});

							fs.readFile(fileUri[0].path, 'utf8', (err, initialContent) => {
								if (err) {
									console.error("Error leyendo el archivo:", err);
									return;
								}
								previousContent = initialContent.split("\n");
							});
						}

						return;
				}
			});
			async function actualizarLista(rutaPrincipal) {
				try {
					// Utiliza la ruta principal proporcionada por el usuario
					const folderNames = await fsP.readdir(rutaPrincipal);

					let organizedFiles = {};

					for (const folder of folderNames) {
						const folderPath = path.join(rutaPrincipal, folder);

						// Verificar si es un directorio antes de proceder
						if ((await fsP.stat(folderPath)).isDirectory()) {
							const files = await fsP.readdir(folderPath);

							// Filtrar solo archivos CSV y config.js
							const relevantFiles = files.filter(file => /\.csv$/.test(file) || file === 'config.js');

							organizedFiles[folder] = relevantFiles;
						}
					}

					// Aquí iría el código para enviar estos datos al panel web
					panel.webview.postMessage({
						command: 'actualizarLista',
						organizedFiles
					});

					console.log('organizedFiles.', organizedFiles)
				} catch (err) {
					console.log('Error al obtener carpetas y archivos', err);
				}
			}
			actualizarLista(rutaPrincipal)
		}
	);

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return `
	  <html>
	  <head>
		<style>
		  /* Tus estilos aquí */
		  @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap");
		  @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap");
			@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');

			* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
			font-family: "Poppins", sans-serif;
			}

			.container {
			height: 100vh;
			width: 100%;
			align-items: center;
			display: flex;
			justify-content: center;
			background-color: #fcfcfc;
			}

			.card {
			border-radius: 10px;
			box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.3);
			width: 600px;
			height: 260px;
			background-color: #ffffff;
			padding: 10px 30px 40px;
			}

			.card h3 {
			font-size: 22px;
			font-weight: 600;
			
			}

			.drop_box {
			margin: 10px 0;
			padding: 30px;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			border: 3px dotted #a3a3a3;
			border-radius: 5px;
			}

			.drop_box h4 {
			font-size: 16px;
			font-weight: 400;
			color: #2e2e2e;
			}

			.drop_box p {
			margin-top: 10px;
			margin-bottom: 20px;
			font-size: 12px;
			color: #a3a3a3;
			}

			.btn {
			text-decoration: none;
			background-color: #005af0;
			color: #ffffff;
			padding: 10px 20px;
			border: none;
			outline: none;
			transition: 0.3s;
			}

			.btn:hover{
			text-decoration: none;
			background-color: #ffffff;
			color: #005af0;
			padding: 10px 20px;
			border: none;
			outline: 1px solid #010101;
			}
			.form input {
			margin: 10px 0;
			width: 100%;
			background-color: #e2e2e2;
			border: none;
			outline: none;
			padding: 12px 20px;
			border-radius: 4px;
			}

		</style>
		<script>
		window.addEventListener('message', event => {
			const message = event.data;
			console.log("Mensaje recibido:", message);
			switch (message.command) {
				case 'actualizarLista':
					init(message.folders, message.csvFiles);
					break;
			}
		});
		
		const vscode = acquireVsCodeApi();
			console.log('script')
		window.addEventListener('message', event => {
		  const message = event.data;
		  switch (message.command) {
			case 'loadCsv':
			  const content = message.content;
			  let tableHtml = '<table>';
			  content.forEach(row => {
				tableHtml += '<tr>';
				row.forEach(cell => {
				  tableHtml += '<td>' + cell + '</td>';
				});
				tableHtml += '</tr>';
			  });
			  tableHtml += '</table>';
			  document.getElementById('csvContent').innerHTML = tableHtml;
			  break;
		  }
		});
  
		const loadCsv = () => {
		  vscode.postMessage({ command: 'loadCsv' });
		};
		
		///MOSTRAR CARPETAS Y ARCHIVOS
		
		</script>
		
	  </head>
	  <body>
		<!-- El código HTML adicional -->
		<div class="container">
		  <div class="card">
			<h3>Upload File</h3>
			<div class="drop_box">
			  <header>
				<h4>Select File here</h4>
			  </header>
			  <p>Files Supported: CSV</p>
			  <input type="file" hidden accept=".doc,.docx,.pdf" id="fileID" style="display:none;">
			  <button class="btn" onclick="loadCsv()">Cargar CSV</button>
			  <div id="folderList"></div>
        <div id="csvList"></div>

        <script>
            function init(folders, csvFiles) {
				console.log('folders',folders, 'csvFiles', csvFiles)
                let folderListHtml = "<ul>";
                for(let i = 0; i < folders.length; i++) {
                    folderListHtml += "<li>" + folders[i] + "</li>";
                }
                folderListHtml += "</ul>";

                let csvListHtml = "<ul>";
                for(let i = 0; i < csvFiles.length; i++) {
                    csvListHtml += "<li>" + csvFiles[i] + "</li>";
                }
                csvListHtml += "</ul>";

                document.getElementById("folderList").innerHTML = folderListHtml;
               	document.getElementById("csvList").innerHTML = csvListHtml;
            }

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'actualizarLista':
                        init(message.folders, message.csvFiles);
                    	break;
                }
            });
        </script>
			</div>
		  </div>
		</div>
  
	  </body>
	  </html>`;
}


function findEditedRows(previous, current) {
	const editedRows = [];

	for (let i = 0; i < Math.min(previous.length, current.length); i++) {
		const prevRow = previous[i].join(",");
		const currRow = current[i].join(",");

		if (prevRow !== currRow) {
			// Convertir cada fila en un objeto para facilidad de uso
			const rowObject = current[i].reduce((obj, cell, index) => {
				obj[`col${index}`] = cell;
				return obj;
			}, {});
			editedRows.push(rowObject);
		}
	}

	console.log("editedRows----", editedRows);
	return editedRows;
}

function parseCSV(str) {
	const rows = str.split("\n");
	return rows.map((row) => {
		return row.split(",");
	});
}

exports.activate = activate;
