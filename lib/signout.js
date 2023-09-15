const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function signOut() {
    const inquirer = (await import('inquirer')).default;

    const { domain } = await inquirer.prompt({
        type: 'input',
        name: 'domain',
        message: "Enter subdomain (e.g. 'dev4' for 'dev4.prolibu.com') to sign out from:",
    });

    const fullDomain = `${domain}.prolibu.com`;
    const configDir = path.join(__dirname, '..', 'accounts', domain);
    const profilePath = path.join(configDir, 'profile.json');

    // Check if profile.json exists for the specified domain
    if (!fs.existsSync(profilePath)) {
        console.error(`No active session found for ${fullDomain}.`);
        return;
    }

    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

    if (!profile.apiKey) {
        console.error('API Key not found. Unable to sign out.');
        return;
    }

    try {
        await axios.delete(
            `https://${fullDomain}/v2/auth/signout`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${profile.apiKey}`,
                },
            },
        );

        // Delete the profile.json file after successful signout
        fs.unlinkSync(profilePath);

        console.log(`\nSign out from ${fullDomain} successful!`);

    } catch (error) {
        console.error('Error signing out:', error.response ? error.response.data : error.message);
    }
}

module.exports = signOut;
