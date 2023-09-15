const axios = require('axios');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt');

async function signIn() {
  // Start prompt
  prompt.start();

  // Get domain
  const { domain } = await new Promise((resolve) => {
    prompt.get({
      properties: {
        domain: {
          description: "Enter subdomain (e.g. 'dev4' for 'dev4.prolibu.com'):",
        },
      },
    }, (err, result) => resolve(result));
  });

  const fullDomain = `${domain}.prolibu.com`;

  // Get email
  const { email } = await new Promise((resolve) => {
    prompt.get({
      properties: {
        email: {
          description: `Enter email for ${fullDomain}:`,
        },
      },
    }, (err, result) => resolve(result));
  });

  // Get password
  const { password } = await new Promise((resolve) => {
    prompt.get({
      properties: {
        password: {
          description: 'Enter password:',
          hidden: true,
        },
      },
    }, (err, result) => resolve(result));
  });

  try {
    const response = await axios.post(
      `https://${fullDomain}/v2/auth/signin`,
      {
        email,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    if (response.data && response.data.apiKey) {
      // Fetch user data
      const userResponse = await axios.get(
        `https://${fullDomain}/v2/user/me`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${response.data.apiKey}`,
          },
        },
      );

      const configDir = path.join(__dirname, '..', 'accounts', domain);
      fs.mkdirSync(configDir, { recursive: true });
      const profile = {
        apiKey: response.data.apiKey,
        me: userResponse.data,
      };
      fs.writeFileSync(
        path.join(configDir, 'profile.json'),
        JSON.stringify(profile, null, 2),
      );
      console.log(`\nSign in successful, welcome ${profile.me.profile.firstName} ${profile.me.profile.lastName || ''}!`);
    } else {
      console.log('Invalid response from server');
    }
  } catch (error) {
    console.error('Error signing in:', error.response ? error.response.data : error.message);
  }
}

module.exports = signIn;
