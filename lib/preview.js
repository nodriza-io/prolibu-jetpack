const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios'); // Make sure to install axios if not done already
const reload = require('reload');
const handlebars = require('handlebars');
const chokidar = require('chokidar');

function findHbsFile(baseDir, templateName) {
  const directories = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

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

function preview(domain, templateName, port = 3000) {
  const basePath = path.join(__dirname, '..', 'accounts', domain, 'data', 'template', 'html');
  const bodyPath = findHbsFile(basePath, templateName);

  if (!bodyPath) {
    console.error(`Template not found for '${templateName}'`);
    return;
  }

  const jsonDataPath = bodyPath.replace('.hbs', '.json');

  const app = express();

  app.get('/', async (req, res) => {
    const { jsonData } = req.query;
    const bodyContent = fs.readFileSync(bodyPath, 'utf8');
    let templateData = {};

    if (jsonData) {
      try {
        const response = await axios.get(jsonData);
        templateData = response.data;
      } catch (error) {
        console.error(`Error fetching JSON data from: '${jsonData}'`, error.message);
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
    chokidar.watch(basePath).on('change', (changedPath) => {
      if (changedPath.endsWith('.hbs') || changedPath.endsWith('.json')) {
        reloadReturned.reload();
      }
    });

    // Start the express app
    app.listen(port, () => {
      console.log(`Live preview server running on http://localhost:${port}`);
    });
  });
}

module.exports = preview;
