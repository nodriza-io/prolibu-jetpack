const fs = require('fs');
const path = require('path');
const express = require('express');
const reload = require('reload');
const handlebars = require('handlebars');
const chokidar = require('chokidar');

function preview(domain, templateName, port = 3000) {
    const basePath = path.join(__dirname, '..', 'accounts', domain, 'data', 'template', 'html');
    const bodyPath = path.join(basePath, `${templateName}.hbs`);
    const jsonDataPath = path.join(basePath, `${templateName}.json`);

    if (!fs.existsSync(bodyPath)) {
        console.error(`Template not found at ' ${bodyPath}'`);
        return;
    }

    const app = express();

    app.get('/', (req, res) => {
        const bodyContent = fs.readFileSync(bodyPath, 'utf8');

        let templateData = {};
        if (fs.existsSync(jsonDataPath)) {
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
