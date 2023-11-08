const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios'); // Make sure to install axios if not done already
const reload = require('reload');
const chokidar = require('chokidar');
const colors = require('colors');
const handlebars = require('handlebars');

const info = {
  appName: 'Prolibu',
  domain: 'dev4.prolibu.com',
  commercialDomain: 'prolibu.com',
  poolName: undefined,
  albGroupName: undefined,
  releaseVersion: '2.3.2',
  replicas: undefined,
  pod: 'e97164386293',
  mods: 'proposals,cpq,saas',
  sdkJs: 'https://s3.amazonaws.com/public.prolibu.com/domains/dev4.prolibu.com/static/sdk.js',
  publicBucket: 'public.prolibu.com',
  privateBucket: 'private.prolibu.com',
  cdn: 'https://s3.amazonaws.com/public.prolibu.com/cdn/',
  podBirth: '2023-10-17T14:53:08+00:00',
  locale: {
    country: 'CO',
    language: 'es',
    timeZone: 'America/Bogota',
    currency: 'COP',
    currencySymbol: '$',
    numberFormat: '0,0',
  },
};

handlebars.registerHelper('t', (key) => key);
handlebars.registerHelper('info', (key) => info[key] || 'unknown key');
handlebars.registerHelper('appName', (key) => info[key] || 'Prolibu');
handlebars.registerHelper('json', (context) => JSON.stringify(context));
// register eq and utils
handlebars.registerHelper('eq', (a, b) => a === b);

async function uploadTemplate(domain, templatePath, apiKey) {
  const dirPath = path.dirname(templatePath);
  const keyname = path.basename(dirPath);
  let body;
  let jsonData;
  if (templatePath.endsWith('.hbs')) {
    body = fs.readFileSync(templatePath, 'utf8');
  } else if (templatePath.endsWith('.json')) {
    try {
      jsonData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    } catch (error) {
      console.error(error);
      jsonData = {};
    }
  }

  const requestData = {
    ...body ? { body } : {},
    ...jsonData ? { jsonData } : {},
  };

  try {
    await axios.patch(`https://${domain}.prolibu.com/v2/template/${keyname}`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
    console.log(`Auto-upload successful for template: ${keyname}`.green);
  } catch (error) {
    console.error(`Auto-upload error for template: ${keyname}`.red, error.message);
    if (_.get(error, 'response.data')) {
      console.error(error.response.data);
    }
  }
}

function findHbsFile(baseDir, templateName) {
  const directories = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const dir of directories) {
    const fullPath = path.join(baseDir, dir);
    const possibleHbsPath = path.join(fullPath, `${templateName}.hbs`);

    if (fs.existsSync(possibleHbsPath)) {
      return possibleHbsPath;
    }

    const recursivePath = findHbsFile(fullPath, templateName);
    if (recursivePath) {
      return recursivePath;
    }
  }

  return null;
}

function preview(domain, templateName, port = 3000, autoUpload = false) {
  const basePath = path.join(__dirname, '..', 'accounts', domain, 'data', 'template', 'html');
  const bodyPath = findHbsFile(basePath, templateName);

  const profile = u.getProfile(domain);
  const { apiKey } = profile;

  if (!bodyPath) {
    console.error(`Template not found for '${templateName}'`);
    return;
  }

  const jsonDataPath = bodyPath.replace('.hbs', '.json');

  const app = express();

  const publicPath = path.resolve('accounts/dev4/data/template/html/public/');
  app.use(express.static(publicPath));

  app.get('/', async (req, res) => {
    const { jsonData } = req.query;
    const bodyContent = fs.readFileSync(bodyPath, 'utf8');
    let templateData = {};

    if (jsonData) {
      try {
        const response = await axios.get(jsonData);
        templateData = response.data;
      } catch (error) {
        console.error(`Error fetching JSON data from: '${jsonData}'`.red, error.message);
      }
    } else if (fs.existsSync(jsonDataPath)) {
      templateData = JSON.parse(fs.readFileSync(jsonDataPath, 'utf8'));
    } else {
      console.error(`Warning: JSON example data not found at '${jsonDataPath}'`);
    }

    const compiledTemplate = handlebars.compile(bodyContent);
    let renderedContent = compiledTemplate(templateData);

    // Append the reload script directly to the rendered content
    renderedContent += '<script src="/reload/reload.js"></script>';

    res.send(renderedContent);
  });

  // Set up live reload
  reload(app).then((reloadReturned) => {
    chokidar.watch(basePath).on('change', async (changedPath) => {
      if (changedPath.endsWith('.hbs') || changedPath.endsWith('.json')) {
        reloadReturned.reload();
        if (autoUpload) {
          await uploadTemplate(domain, changedPath, apiKey);
        }
      }
    });

    // Start the express app
    app.listen(port, () => {
      console.log(`Live preview server running on http://localhost:${port}`);
    });
  });
}

module.exports = preview;
