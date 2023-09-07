const vscode = require('vscode');
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const fsAsync = require('fs').promises;

//FUNCIONES 
async function createDomain() {
	try {
		//TEST PARA PROBAR COMO OBTENER EL DOMINIO
		const domainName = await vscode.window.showInputBox({
		  prompt: "Introduce el nombre del dominio",
		  placeHolder: "Nombre del dominio",
		});

		const domainApikey = await vscode.window.showInputBox({
		  prompt: "Intruoduce el apikey",
		  placeHolder: "apikey de la cuenta",
		});
  
		if (domainName && domainApikey)
		  return createFolders(domainName, domainApikey);
	  } catch (error) {
		console.error(error);
	  }
}
//CLICK ARCHIVO
async function handleFileClicked(fileData) {
	console.log('Archivo clickeado:', fileData);
	const domain = fileData.domain;
	const fileName = fileData.file;

	const filePath = path.join(__dirname, 'accounts', domain, fileName); // Asegúrate de que esta sea la ruta correcta al archivo

	try {
		const document = await vscode.workspace.openTextDocument(filePath);
		await vscode.window.showTextDocument(document);
	} catch (e) {
		vscode.window.showErrorMessage('No se pudo abrir el archivo');
	}
}
//funcion para listar
async function listAccountsDirectory() {
    try {
        const accountsDir = path.join(__dirname, 'accounts');
        const domains = fs.readdirSync(accountsDir);
        
        let fullFileList = {};

        for (const domain of domains) {
            const domainPath = path.join(accountsDir, domain);
            if (fs.statSync(domainPath).isDirectory()) {
                const filesInDomain = fs.readdirSync(domainPath);
                fullFileList[domain] = filesInDomain;
            }
        }

        return fullFileList;

    } catch (err) {
        console.error("No se pudo leer el directorio", err);
        return null;
    }
}

//LOGICA PRINCIPAL DE LA EXTENSION
function createFolders(domain, apikey) {
  const apiKey = apikey; // Supongamos que éste es el apiKey que obtuviste
  const domainName = domain; // Este valor deberás obtenerlo del usuario o de otra fuente

  // Crear la carpeta 'accounts' si no existe
  const accountsDir = path.join(__dirname, "accounts");
  if (!fs.existsSync(accountsDir)) {
    fs.mkdirSync(accountsDir);
  }

  // Crear la carpeta del dominio dentro de 'accounts'
  const domainDir = path.join(accountsDir, domainName);
  if (!fs.existsSync(domainDir)) {
    fs.mkdirSync(domainDir);
  }

  // Crear y escribir en config.js
  const configPath = path.join(domainDir, "config.json");
  const configData = `{"apiKey": "${apiKey}"}`;
  fs.writeFileSync(configPath, configData);

  // Crear archivos CSV vacíos
  const userCsvPath = path.join(domainDir, "user.csv");
  const categoryCsvPath = path.join(domainDir, "category.csv");
  fs.writeFileSync(userCsvPath, "");
  fs.writeFileSync(categoryCsvPath, "");
}

function activate(context) {
  // Comando para abrir el visualizador de CSV
//   context.subscriptions.push(
// 	vscode.commands.registerCommand('extension.importDomain', getDomainList)
//   );
  context.subscriptions.push(
	vscode.commands.registerCommand('extension.createDomain', createDomain)
  );
  	//const cliPath = path.join(__dirname, 'cli.js');

//   let terminal = vscode.window.createTerminal("Prolibu CLI");
//   let disposableCommand = vscode.commands.registerCommand('extension.runProlibuCLI', () => {
// 	terminal.show();
// 	terminal.sendText(`node ${cliPath} import miDominio -c miColeccion`);	  
//   });
	const terminal = vscode.window.createTerminal("Mi terminal personalizado");
	terminal.show();

	// Suponiendo que cli.js está en la misma carpeta que tu extension.js
	const cliPath = path.join(__dirname, 'cli.js');

	// Configurar alias
	terminal.sendText(`alias prolibu="node ${cliPath}"`);
  let disposable = vscode.commands.registerCommand(
    "extension.abrirCsv",
    function () {
      const panel = vscode.window.createWebviewPanel(
        "csvViewer",
        "Visualizador de CSV",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
		  retainContextWhenHidden: true // añadir esta línea

        }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case "doLogin":
            const { email, password } = message;

            try {
              const responseSignin = await axios.post(
                "https://dev4.prolibu.com/v2/auth/signin",
                {
                  email: "juan.prieto@prolibu.com",
                  password: "Shox009_",
                }
              );
              // Cambiar a la siguiente vista si la autenticación es exitosa
              if (responseSignin.status === 200) {
                const responseMe = await axios.get(
                  "https://dev4.prolibu.com/v2/user/me",
                  {
                    headers: {
                      Authorization: `Bearer ${responseSignin.data.apiKey}`,
                    },
                  }
                );

                if (responseMe.status === 200) {
                  // Guardar datos del usuario
                  const config =
                    vscode.workspace.getConfiguration("miExtension");
                  await config.update(
                    "userData",
                    responseMe.data,
                    vscode.ConfigurationTarget.Global
                  );

                  // Cambiar a la siguiente vista
                  const userData = responseMe.data;
                  const { firstName, email, lastName } = userData;
                  console.log(
                    `Bienvenido ${firstName} (${email}) - ${lastName}`
                  );

                  panel.webview.postMessage({
                    command: "changeView",
                    view: "nextView",
                    userData, // Enviar datos del usuario a la nueva vista
                  });

                  //TEST PARA PROBAR COMO OBTENER EL DOMINIO
                //   const domainName = await vscode.window.showInputBox({
                //     prompt: "Introduce el nombre del dominio",
                //     placeHolder: "Nombre del dominio",
                //   });

                //   if (domainName)
                //     return createFolders(
                //       domainName,
                //       responseSignin.data.apiKey
                //     );

                  // Crear carpetas y archivos
                }
              } else {
                panel.webview.postMessage({ command: "loginFailed" });
              }
            } catch (error) {
              // Manejar errores
              console.error(error);
              panel.webview.postMessage({ command: "loginFailed" });
            }
            break;
        }
      });

      // Función para obtener la lista de dominios desde el directorio 'accounts'
      async function getDomainList() {
        const accountsPath = path.join(__dirname, "accounts"); // Asegúrate de que esta sea la ruta correcta al directorio 'accounts'
        return new Promise((resolve, reject) => {
          fs.readdir(accountsPath, (err, files) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(files);
          });
        });
      }

      // Importar datos
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "importData":
              console.log("Importando datos...");
              // Obtiene la lista de dominios
              let domainList;
              try {
                domainList = await getDomainList();
              } catch (err) {
                console.error("Error al leer el directorio 'accounts':", err);
                return;
              }

              // Muestra la lista de dominios en un cuadro QuickPick
              const domain = await vscode.window.showQuickPick(domainList, {
                placeHolder: "Elige un dominio",
              });
              // Pide al usuario que ingrese o seleccione un dominio
              // const domain = await vscode.window.showInputBox({
              // 	prompt: 'Introduce el dominio',
              // 	placeHolder: 'Tu dominio aquí'
              // });

              if (!domain) return;

              // Solicita el tipo de flag (o "flap") a utilizar
              const flag = await vscode.window.showQuickPick(
                ["-c --collection", "-q --query", "-o --output"],
                {
                  placeHolder: "Elige un flag",
                }
              );

              if (!flag) {
                // Aquí puedes hacer algo para identificar que no se seleccionó ningún flag
                // Por ejemplo, enviar un mensaje o simplemente salir de la función
                console.log("Ningún flag seleccionado, importando todo.");
                return;
              }

              let collection, query;

              // Según el flag, realiza una acción diferente
              switch (flag) {
                case "-c --collection":
                  collection = await vscode.window.showQuickPick(
                    ["Opción 1", "Opción 2", "Opción 3"],
                    {
                      placeHolder: "Elige una colección",
                    }
                  );
                  if (!collection) return;
                  break;
                case "-q --query":
                  query = await vscode.window.showInputBox({
                    prompt: "Introduce tu consulta",
                    placeHolder: "Tu consulta aquí",
                  });
                  if (!query) return;
                  break;
                case "-o --output":
                  // Aquí iría la lógica para manejar este flag
                  break;
              }

              // Aquí iría la lógica para importar los datos con las opciones seleccionadas
              return;
          }
        },
        undefined,
        context.subscriptions
      );

      // Crear dominio
      panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case "createDomain":
            try {
              //TEST PARA PROBAR COMO OBTENER EL DOMINIO
              const domainName = await vscode.window.showInputBox({
                prompt: "Introduce el nombre del dominio",
                placeHolder: "Nombre del dominio",
              });

			  const domainApikey = await vscode.window.showInputBox({
                prompt: "Intruoduce el apikey",
                placeHolder: "apikey de la cuenta",
              });
        
              if (domainName && domainApikey)
                return createFolders(domainName, domainApikey);
            } catch (error) {
              console.error(error);
            }
        }
      });

	  panel.webview.onDidReceiveMessage(async (message) => {
		switch (message.command) {
			case 'fileClicked':
				// Aquí manejas el clic en un archivo
				// `message.data` contiene los datos del archivo clickeado
				handleFileClicked(message.data);
				break;
			// Otros casos
		}
		}, undefined, context.subscriptions);
	
	  	listAccountsDirectory().then(fullFileList => {
			if (fullFileList) {
				panel.webview.postMessage({
					command: 'updateFileList',
					fileList: fullFileList
				});
			}
		});
	}
  );

  context.subscriptions.push(disposable);
}

//VISTAS DE LA EXTENSION WEBVIEW
function getWebviewContent() {
  return `
	<html>
	<head></head>
	<body>file:///home/juan/Documentos/Leads.xls

		<style>
		.iframe
		{
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 1;  
		width: 100%;
		min-height: 100%;
		padding-top: 4em;
		-moz-box-sizing: border-box;
		box-sizing: border-box;
		}
		</style>
		<div id="loginView">
		<iframe class="iframe" src="https://docs.google.com/spreadsheets/d/19c7UDFi-sSzhH069m8SEFLgOJ9tUZ37cQkjfrGGqA2c/edit#gid=0"></iframe>
			<!--<h1>Login</h1>
			<input type="text" id="email" placeholder="Usuario">
			<input type="password" id="password" placeholder="Contraseña">
			<button onclick="doLogin()">Iniciar sesión</button>-->
		</div>
		<div id="nextView" style="display: none;">
			<h1>Esta es la siguiente vista</h1>
			<div id="userInfo"></div> <!-- Elemento para mostrar la información del usuario -->
			<button id="importButton">Importar Datos</button>
			<button id="createButton">Crear Dominio</button>
			<h1>Dominios</h1>
			<!-- Añade esto en tu webview HTML -->
			<div id="file-list-container"></div>

		</div>
		<script>
			const vscode = acquireVsCodeApi();

			function doLogin() {
				const email = document.getElementById('email').value;
				const password = document.getElementById('password').value;

				vscode.postMessage({
					command: 'doLogin',
					email,
					password
				});
			}

			window.addEventListener('message', event => {
				const message = event.data;
				switch (message.command) {
					case 'changeView':
						// Mostrar la información del usuario en la nueva vista
						const userData = message.userData;
						document.getElementById('userInfo').innerText = "Bienvenido " + userData.firstName + " " + userData.lastName;
						
						document.getElementById('loginView').style.display = 'none';
						document.getElementById('nextView').style.display = 'block';
						break;
					// ... (el resto del código se mantiene igual)
				}
			});
		</script>
		<script>
			document.getElementById('importButton').addEventListener('click', () => {
				vscode.postMessage({
					command: 'importData'
				});
			});
		</script>
		<script>
			document.getElementById('createButton').addEventListener('click', () => {
				vscode.postMessage({
					command: 'createDomain'
				});
			});
		</script>
		<!-- Dentro de tu HTML para el webview -->
		<script>
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateFileList':
                updateFileListUI(message.fileList);
                break;
        }
    });

    function updateFileListUI(fileList) {
        const container = document.getElementById('file-list-container');
        container.innerHTML = '';

        for (const [domain, files] of Object.entries(fileList)) {
            const domainElement = document.createElement('div');
            domainElement.textContent = domain;
            container.appendChild(domainElement);

            const fileListElement = document.createElement('ul');
            for (const file of files) {
                const fileElement = document.createElement('li');
                fileElement.textContent = file;

                // Agregamos un evento de clic al elemento de archivo
                fileElement.addEventListener('click', () => {
                    // Aquí puedes poner lo que quieras hacer cuando se haga clic en el archivo
                    // Por ejemplo, enviar un mensaje al código de la extensión.
                    const clickedFileData = { domain, file };
                    vscode.postMessage({
                        command: 'fileClicked',
                        data: clickedFileData
                    });
                });

                fileListElement.appendChild(fileElement);
            }

            container.appendChild(fileListElement);
        }
    }
</script>


	</body>
	</html>`;
}

/* PENDIENTES

- VISTAS DE LA EXTENSION WEBVIEW LOGIN
- VALIDAR LOGIN
- VISTA DE LA EXTENSION WEBVIEW CSV

*/

/* GUARDAR
// Leer datos del usuario mas tarde
const config = vscode.workspace.getConfiguration('tuExtension');
const userData = config.get('userData');

*/

/* POR RESOLVER 

 - NECESITO EXPORTAR EL APIKEY
*/
exports.activate = activate;
