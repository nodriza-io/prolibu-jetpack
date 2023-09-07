const path = require("path");
const fs = require("fs");
const { program } = require('commander');
const axios = require('axios');
const XLSX = require('xlsx'); // Asegúrate de tener instalado este paquete


async function updateExcelFile(excelFilePath, serviceResponse) {
  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir la hoja de Excel a un array de objetos
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Actualizar las filas creadas
  for (const createdItem of serviceResponse.created) {
    const email = createdItem.email;
    console.log(`email CREATE: ${email}`);
    const existingRow = rows.find(row => row.email === email);
    if (existingRow) {
      const newRow = {
        _id: createdItem._id,
        lastName: createdItem.lastName,
        phone: createdItem.phone,
        updatedAt: createdItem.updatedAt,
        createdBy: createdItem.createdBy,
        updatedBy: createdItem.updatedBy,
        firstName: createdItem.firstName,
        email: createdItem.email,
        emailVerified: createdItem.emailVerified,
        'address.country': createdItem.address ? createdItem.address.country : null,
        'address.state': createdItem.address ? createdItem.address.state : null,
        'address.city': createdItem.address ? createdItem.address.city : null,
        'address.street': createdItem.address ? createdItem.address.street : null,
        'address.zipCode': createdItem.address ? createdItem.address.zipCode : null,
        'address.location.lat': createdItem.address ? createdItem.address.location.lat : null,
        'address.location.long': createdItem.address ? createdItem.address.location.long : null,
        isAdmin: createdItem.isAdmin,
        groups: createdItem.groups || [],
        roles: createdItem.roles || [],
        status: createdItem.status,
        createdAt: createdItem.createdAt,
        avatar: createdItem.avatar
      };
      rows.push(newRow); // Agrega la fila al final
    }
  }
  
  // Actualizar las filas modificadas
  for (const updatedItem of serviceResponse.updated) {
    const email = updatedItem.email;
    const existingRow = rows.find(row => row.email === email);
    if (existingRow) {
      const newRow = {
        _id: updatedItem._id,
        lastName: updatedItem.lastName,
        phone: updatedItem.phone,
        updatedAt: updatedItem.updatedAt,
        createdBy: updatedItem.createdBy,
        updatedBy: updatedItem.updatedBy,
        firstName: updatedItem.firstName,
        email: updatedItem.email,
        emailVerified: updatedItem.emailVerified,
        'address.country': updatedItem.address ? updatedItem.address.country : null,
        'address.state': updatedItem.address ? updatedItem.address.state : null,
        'address.city': updatedItem.address ? updatedItem.address.city : null,
        'address.street': updatedItem.address ? updatedItem.address.street : null,
        'address.zipCode': updatedItem.address ? updatedItem.address.zipCode : null,
        'address.location.lat': updatedItem.address ? updatedItem.address.location.lat : null,
        'address.location.long': updatedItem.address ? updatedItem.address.location.long : null,
        isAdmin: updatedItem.isAdmin,
        groups: updatedItem.groups || [],
        roles: updatedItem.roles || [],
        status: updatedItem.status,
        createdAt: updatedItem.createdAt,
        avatar: updatedItem.avatar
      };
      rows.push(newRow); // Agrega la fila al final
    }
  }
  
  // Convertir el array de objetos de nuevo a una hoja de Excel
  console.log('Actualizando el archivo Excel...', rows);
  const newWorksheet = XLSX.utils.json_to_sheet(rows);
  workbook.Sheets[sheetName] = newWorksheet;
  
  // Guardar los cambios en el archivo Excel
  XLSX.writeFile(workbook, excelFilePath);
}

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
    // URL del servicio externo que devuelve un archivo Excel
    const url = 'https://dev4.prolibu.com/v2/user/?exportData=true&format=xlsx';

    // Realizar la petición HTTP GET
    axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      maxBodyLength: Infinity,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer bf991800d5ed76f154a49c53a3fd5a6c4e04afe9ac3df4616a3206aaade691cafae0f194c892cbe56d8944b200364364`
      }
    })
      .then((response) => {
        // Especificar la ubicación y nombre del archivo donde se guardará
        const filepath = path.resolve(__dirname, 'descarga.xlsx');

        // Crear un stream de escritura para guardar el archivo
        const writer = fs.createWriteStream(filepath);

        // Escribir los datos en el archivo a medida que se reciben
        response.data.pipe(writer);
      })
      .catch((error) => {
        console.log(error);
      });
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
  .name('prolibu')
  .description('Ya puedes usar el comando "prolibu" en la terminal para ejecutar este programa.');


program
  .command('import <domain>')
  .description('Importa datos desde un dominio especificado')  // Agrega la descripción aquí
  .option('-c, --collection <collection>', 'Especifica la colección')
  .option('-q, --query', 'Realizar una consulta')
  .option('-o, --output <output>', 'Especifica el archivo de salida')
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
        // Leer el archivo config.json para obtener la apikey
        const configPath = path.join(__dirname, 'accounts', domain, 'config.json');
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const apiKey = configData.apikey;
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
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
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
        const dataToSend = modifiedRows[modelName];


        convertFields(dataToSend);  // Convierte campos vacíos a null y TRUE a "1"

        console.log('Data to send:', JSON.stringify(dataToSend, null, 2));

        try {
          const response = await axios.post(`https://dev4.prolibu.com/v2/service/importdata/${modelName}`, dataToSend, config);
          console.log(`Respuesta del servidor: ${response.status}`);

           // Aquí recibes la respuesta del servicio que contiene los elementos 'created' y 'updated'
        const serviceResponse = response.data; // Ajusta esto de acuerdo a cómo el servicio devuelva los datos

        // Actualiza el archivo Excel con los datos recibidos
        const excelFilePath = path.join(__dirname, "accounts", domain, `${modelName}.xlsx`); // Ruta al archivo Excel que quieres actualizar

        console.log(`Actualizando el archivo Excel: ${excelFilePath}`);
        //await updateExcelFile(excelFilePath, serviceResponse);  // Suponiendo que `updateExcelFile` es una función async
        console.log('Archivo Excel actualizado.');
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
  .command('signin <domain> <email> <password>')
  .description('Inicia sesión en un dominio especificado con usuario y contraseña')
  .action(async (domain, email, password) => {
    try {
      const respSignin = await axios.post(`https://dev4.prolibu.com/v2/auth/signin`, {
        email: email,
        password: password,
      });

      if (respSignin.status === 200) {
        let token = respSignin.data.apiKey;
        if (!fs.existsSync(__dirname, 'accounts')) {
          fs.mkdirSync(__dirname, 'accounts');
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

        const respMe = await axios.get(`https://dev4.prolibu.com/v2/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        if (respMe.status === 200) {
          console.log(`Bienvenido ${respMe.data.firstName} ${respMe.data.lastName}`);
          program.outputHelp();
        }
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
// Si ningún comando se ha dado, mostrar la ayuda.
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

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
