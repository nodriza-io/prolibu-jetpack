const fs = require('fs');
const path = require('path');
const express = require('express');
const reload = require('reload');
const handlebars = require('handlebars');
const chokidar = require('chokidar');

function preview(domain, templateName, port = 3000) {
  const basePath = path.join(__dirname, '..', 'accounts', domain, 'data', 'template', 'html');
  const templatePath = path.join(basePath, `${templateName}.hbs`);
  const dataPath = path.join(basePath, `${templateName}.json`);

  if (!fs.existsSync(templatePath) || !fs.existsSync(dataPath)) {
    console.error('Template or data file missing.');
    return;
  }

  const app = express();

  app.get('/', (req, res) => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const templateData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const compiledTemplate = handlebars.compile(templateContent);
    let renderedContent = compiledTemplate(templateData);

    // Append the reload script directly to the rendered content
    renderedContent += '<script src="/reload/reload.js"></script>';

    res.send(renderedContent);
  });

  // Set up live reload
  reload(app).then((reloadReturned) => {
    // Use chokidar to watch the base path for changes
    chokidar.watch(basePath).on('change', (changedPath) => {
      if (changedPath.endsWith('.hbs') || changedPath.endsWith('.json')) {
        reloadReturned.reload(); // trigger the reload
      }
    });

    // Start the express app
    app.listen(port, () => {
      console.log(`Live preview server running on http://localhost:${port}`);
    });
  });
}

module.exports = preview;
