const axios = require('axios');

async function request({ account, method, modelName, data, apiKey }) {
  const url = `https://${account}.prolibu.com/v2/${modelName}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = {
  request
};