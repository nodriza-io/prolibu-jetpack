const axios = require('axios');

async function fetchFigmaData(fileId, FIGMA_TOKEN) {
  try {
    const endpoint = `https://api.figma.com/v1/files/${fileId}`;
    const headers = {
      Authorization: `Bearer ${FIGMA_TOKEN}`,
    };

    const response = await axios.get(endpoint, { headers });
    console.log(response.data); // Printing the entire response data
  } catch (error) {
    console.error('Error fetching data from Figma:', error.response ? error.response.data : error.message);
  }
}

// Usage:
const fileId = 'rCTsvBFS05Ka2pQPEKmoqA'; // Replace with your actual file ID
const FIGMA_TOKEN = 'figd_sM5DTdNkcKLkWscFJuSfzgr5TN1zVR3laNk4hB3_'; // Replace with your actual Figma token
fetchFigmaData(fileId, FIGMA_TOKEN);
