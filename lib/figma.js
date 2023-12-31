const axios = require('axios');
const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').html;

const apiUrl = 'https://api.figma.com/v1/files';
const configPath = path.join(__dirname, '..', 'accounts', 'config.json');
let FIGMA_TOKEN;

if (fs.existsSync(configPath)) {
  // create the config.json file empty {}
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  FIGMA_TOKEN = config.FIGMA_TOKEN;
} else {
  // create the config.json file empty {}
  fs.writeFileSync(configPath, '{}', 'utf8');
}

const headers = {
  'X-Figma-Token': FIGMA_TOKEN,
};

async function downloadAssets(figmaFileId, savePath, keyname) {
  if (!FIGMA_TOKEN) return null;
  try {
    const imagesInfo = await fetchImagesInfo(figmaFileId);
    const fileInfo = await fetchFileData(figmaFileId);

    if (!imagesInfo || !imagesInfo.meta || !imagesInfo.meta.images) {
      throw new Error('Invalid images response from Figma API.');
    }

    if (!fileInfo || !fileInfo.thumbnailUrl) {
      throw new Error('Invalid file data response from Figma API.');
    }

    const imagesFolderPath = path.join(savePath, 'img');
    if (!fs.existsSync(imagesFolderPath)) {
      fs.mkdirSync(imagesFolderPath);
    }

    for (const [imageRef, url] of Object.entries(imagesInfo.meta.images)) {
      const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
      const imageName = path.basename(new URL(url).pathname);
      const imageSavePath = path.join(imagesFolderPath, imageName);
      fs.writeFileSync(`${imageSavePath}.png`, imageResponse.data);
    }

    const thumbnailResponse = await axios.get(fileInfo.thumbnailUrl, { responseType: 'arraybuffer' });
    const thumbnailSavePath = path.join(imagesFolderPath, 'thumbnail.png');
    fs.writeFileSync(thumbnailSavePath, thumbnailResponse.data);

    // generateHtml(fileInfo, keyname, savePath, imagesInfo);
  } catch (error) {
    console.error('Error downloading assets from Figma:', error);
  }
}

async function fetchImagesInfo(fileId) {
  try {
    const url = `${apiUrl}/${fileId}/images`;
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching images data from Figma:', error.response ? error.response.data : error.message);
  }
}

async function fetchFileData(fileId) {
  try {
    const url = `${apiUrl}/${fileId}`;
    const response = await axios.get(url, { headers });

    // console.log('> response.data:', JSON.stringify(response.data.document.children, null, 4));
    // read the response.data.document.children and save the svg nodes

    return response.data;
  } catch (error) {
    console.error('Error fetching file data from Figma:', error.response ? error.response.data : error.message);
  }
}

module.exports = {
  downloadAssets,
};


// function generateHtml(figmaData, keyname, savePath, imagesInfo) {
//   const content = generateHtmlFromNode(figmaData.document, imagesInfo);
//   const wrappedContent = `<main id="content-${keyname}">\n${content}\n</main>`;

//   // Beautify the content
//   const prettyHtml = beautify(wrappedContent, { indent_size: 2 });
//   fs.writeFileSync(path.join(savePath, `${keyname}.html`), prettyHtml, 'utf8');
// }

// function generateHtmlFromNode(node, imagesInfo) {
//   // Guard clause to handle undefined nodes
//   if (!node || !node.type) {
//     return '';
//   }

//   if (node.type === 'GROUP') {
//     return `<section data-section="${node.name}">\n${(node.children || []).map((child) => generateHtmlFromNode(child, imagesInfo)).join('\n')}\n</section>`;
//   }

//   if (node.type === 'TEXT') {
//     return `<p>${node.characters}</p>`;
//   }

//   if (node.type === 'RECTANGLE' && node.fills && node.fills[0].type === 'IMAGE') {
//     const { imageRef } = node.fills[0];
//     const imageUrl = imagesInfo.meta.images[imageRef];
//     if (imageUrl) {
//       const imageName = path.basename(new URL(imageUrl).pathname);
//       return `<img src="./img/${imageName}.png" alt="${node.name}">`;
//     }
//   }

//   // Ensure node.children is defined before mapping over it
//   return (node.children || []).map((child) => generateHtmlFromNode(child, imagesInfo)).join('\n');
// }