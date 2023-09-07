const path = require("path");
const fs = require("fs");
const { program } = require('commander');
const axios = require('axios');
//const vscode = require('vscode');


// Función que implementa el comando 'import'
async function importFunction(domain, options) {
  (async () => {
    let domainList;
    try {
      domainList = await getDomainList();
    } catch (err) {
      console.error("Error al leer el directorio 'accounts':", err);
      return;
    }
    console.log("Dominios disponibles:", domainList);
    console.log(`Importando para el dominio ${domain} con opciones: ${JSON.stringify(options)}`);
  })();
}

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
program
  .command('import <domain>')
  .description('Importa datos desde un dominio especificado')  // Agrega la descripción aquí
  .option('-c, --collection <collection>', 'Especifica la colección')
  .option('-q, --query', 'Realizar una consulta')
  .action((domain, options) => {
    importFunction(domain, options)
  });

program
  .command('export <domain>')
  .description('exportar datos desde un dominio especificado')  // Agrega la descripción aquí
  .action((domain) => {
    (async () => {
      let domainList;
      try {
        domainList = await getDomainList();
      } catch (err) {
        console.error("Error al leer el directorio 'accounts':", err);
        return;
      }
      console.log("Dominios disponibles:", domainList);
      if (domainList.includes(domain)) {
        console.log(`Enviando data para el dominio: ${domain}`);

        // Construye la ruta al archivo JSON
        //const jsonFilePath = path.join('ruta/a/tu/directorio/de/dominios', domain, 'temp.json');
        const jsonFilePath = path.join(__dirname, "accounts", domain, 'data.json'); // Asegúrate de que esta sea la ruta correcta al directorio 'accounts'

        // Lee el archivo JSON
        const jsonData = fs.readFileSync(jsonFilePath, 'utf8');

        // Convierte el contenido del archivo a un objeto JavaScript
        const modifiedRows = JSON.parse(jsonData);
        const modelName = Object.keys(modifiedRows)[0];  // Esto obtiene la primera clave del objeto, asumiendo que hay una sola clave que es el modelo

        console.log(`modelName modelName: ${JSON.stringify(modelName)}`);
        // Configuración para la solicitud POST
        const config = {
          headers: {
            'Authorization': 'Bearer bf991800d5ed76f154a49c53a3fd5a6c4e04afe9ac3df4616a3206aaade691cafae0f194c892cbe56d8944b200364364',
            'Content-Type': 'application/json'
          }
        };

        function convertFields(obj) {
          Object.keys(obj).forEach(key => {
            if (obj[key] === "") {
              obj[key] = null;
            } else if (obj[key] === "TRUE") {
              obj[key] = "true";  // Cambia esto a "true" si prefieres que sea una cadena
            } else if (typeof obj[key] === 'object' && obj[key] !== null) { // para objetos anidados
              convertFields(obj[key]);
            }
          });
        }

        // Uso de la función en tu código existente
        const dataToSend = {
          [modelName]: modifiedRows[modelName]
        };

        convertFields(dataToSend);  // Convierte campos vacíos a null y TRUE a "1"

        console.log(`dataToSend dataToSend: ${JSON.stringify(dataToSend)}`);
        try {
          const response = await axios.post(`https://dev4.prolibu.com/v2/service/importdata/${modelName}`, dataToSend, config);
          console.log(`Respuesta del servidor: ${response.status}`);
          // Suponiendo que tienes los datos de "created" y "updated" en variables
          // let createdCount = response.created.length; // Reemplaza "created" con los datos reales
          // let updatedCount = response.updated.length; // Reemplaza "updated" con los datos reales

          // vscode.window.showInformationMessage(`Se han creado ${createdCount} elementos y se han actualizado ${updatedCount} elementos.`);

        } catch (error) {
          console.error(`Error en la solicitud POST: ${error}`);
        }


        // Aquí puedes enviar `modifiedRows` al servicio web
      } else {
        console.log(`El dominio ${domain} no existe.`);
      }
    })();
  });


program
  .command('signin <domain> <user> <password>')
  .description('Inicia sesión en un dominio especificado con usuario y contraseña')
  .action(async (domain, user, password) => {
    try {
      const response = await axios.post(`https://${domain}.nodriza.io/v1/user/login`, {
        username: user,
        password: password,
      });

      if (response.status === 200) {
        let token = response.data.token.accessToken;
         // Crear la carpeta 'accounts' si no existe
         if (!fs.existsSync(__dirname, 'accounts')) {
          fs.mkdirSync(__dirname,'accounts');
        }

        // Crear la carpeta del dominio dentro de 'accounts'
        const domainFolder = path.join(__dirname, 'accounts', domain);
        if (!fs.existsSync(domainFolder)) {
          fs.mkdirSync(domainFolder);
        }

        // Crear o sobrescribir el archivo config.json con el token
        const configPath = path.join(domainFolder, 'config.json');
        fs.writeFileSync(configPath, JSON.stringify({ apikey: token }, null, 2));

        console.log(`Token guardado en ${configPath}`);
        // const answers = await inquirer.prompt([
        //   {
        //     type: 'confirm',
        //     name: 'doImport',
        //     message: '¿Quieres importar datos ahora?',
        //   },
        // ]);
    
        // if (answers.doImport) {
        //   // Llama a la función que implementa el comando 'import'
        //   importFunction(domain);
        // }
      }
    } catch (error) {
      console.error(`Error al iniciar sesión: ${error}`);
    }
  });
program.parse(process.argv);


// const path = require("path");
// const fs = require("fs");
// const { program } = require('commander');

// // Asumiendo que tienes este require para obtener las filas modificadas
// const { getModifiedRows } = require(__dirname,'extension.js');

// // Función para obtener la lista de dominios desde el directorio 'accounts'
// async function getDomainList() {
//     const accountsPath = path.join(__dirname, "accounts");
//     return new Promise((resolve, reject) => {
//       fs.readdir(accountsPath, (err, files) => {
//         if (err) {
//           reject(err);
//           return;
//         }
//         resolve(files);
//       });
//     });
// }

// program
//   .command('import <domain>')
//   .description('Importa datos desde un dominio especificado')
//   .option('-c, --collection <collection>', 'Especifica la colección')
//   .option('-q, --query', 'Realizar una consulta')
//   .action((domain, options) => {
//     (async () => {
//         let domainList;
//         try {
//             domainList = await getDomainList();
//         } catch (err) {
//             console.error("Error al leer el directorio 'accounts':", err);
//             return;
//         }
//         console.log("Dominios disponibles:", domainList);
//         console.log(`Importando para el dominio ${domain} con opciones: ${JSON.stringify(options)}`);
//     })();
//   });

// // Agregamos el nuevo comando 'export'
// program
//   .command('export <domain>')
//   .description('Envía la data modificada de un dominio específico a un servicio web.')
//   .action((domain) => {
//     (async () => {
//       console.log(`Exportando data para el dominio: ${domain}`);
//       // Verificamos si el dominio existe
//       // let domainList;
//       // try {
//       //     domainList = await getDomainList();
//       // } catch (err) {
//       //     console.error("Error al leer el directorio 'accounts':", err);
//       //     return;
//       // }

//       // if (domainList.includes(domain)) {
//       //   console.log(`Enviando data para el dominio: ${domain}`);
//       //   const modifiedRows = getModifiedRows();
//       //   console.log(`Data modificada: ${JSON.stringify(modifiedRows)}`);
//       //   // Aquí puedes enviar `modifiedRows` al servicio web
//       // } else {
//       //   console.log(`El dominio ${domain} no existe.`);
//       // }
//     })();
//   });

// program.parse(process.argv);
