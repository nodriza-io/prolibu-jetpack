const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function signIn() {
  const inquirer = (await import('inquirer')).default;

  const { domain } = await inquirer.prompt({
    type: 'input',
    name: 'domain',
    message: "Enter subdomain (e.g. 'dev4' for 'dev4.prolibu.com'):",
  });

  const fullDomain = `${domain}.prolibu.com`;

  const { email } = await inquirer.prompt({
    type: 'input',
    name: 'email',
    message: `Enter email for ${fullDomain}:`,
  });

  const { password } = await inquirer.prompt({
    type: 'password',
    name: 'password',
    message: 'Enter password:',
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
