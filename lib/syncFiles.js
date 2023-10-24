const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const colors = require('colors');

function syncFiles(domain, targetPath, selectExt) {
  console.log('--------> domain, targetPath, selectExt:', domain, targetPath, selectExt);
  let watchDir;

  if (_.isEmpty(targetPath)) {
    watchDir = path.join(__dirname, '..', 'accounts', domain, 'data', 'file', 'root');
    if (!fs.existsSync(watchDir)) {
      fs.mkdirSync(watchDir, { recursive: true });
    }
  } else {
    watchDir = path.join(__dirname, '..', 'accounts', domain, 'data', 'file', 'root', targetPath);
    if (!fs.existsSync(watchDir)) {
      throw new Error(`Watch directory not found at: "${watchDir}"`)
    }
  }

  console.log('--------> watchDir:', watchDir);
  // Create the recursive path if it doesn't exist

  const watchOptions = {
    persistent: true,
    ignoreInitial: true,
  };

  if (selectExt) {
    const exts = selectExt.split(' ');
    const includeExts = exts.filter(ext => !ext.startsWith('-')).map(ext => `.${ext}`);
    const excludeExts = exts.filter(ext => ext.startsWith('-')).map(ext => ext.slice(1));

    console.log('--------> includeExts:', includeExts)
    console.log('--------> excludeExts:', excludeExts)
    watchOptions.ignored = (filename) => {
      const ext = path.extname(filename);
      if (includeExts.length && !includeExts.includes(ext)) {
        return true; // ignore files not in includeExts
      }
      if (excludeExts.length && excludeExts.includes(ext)) {
        return true; // ignore files in excludeExts
      }
      return false; // default, do not ignore
    };
  }

  const watcher = chokidar.watch(watchDir, watchOptions);

  watcher.on('change', async (filePath) => {
    console.log(`File changed: ${filePath}`);
  });

  console.log(`Watching for changes in ${watchDir}...`);
}

module.exports = syncFiles;
