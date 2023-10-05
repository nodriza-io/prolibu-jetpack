const fs = require('fs');
const path = require('path');

module.exports = class Utils {
  static sanitizeRecords(records) {
    return records.map((record) => {
      Object.keys(record).forEach((key) => {
        if (record[key] === '') {
          delete record[key];
        }
      });
      return record;
    });
  }

  static logErrorDetails(result, currentChunk, CHUNK_SIZE) {
    result.errors.forEach((errorDetail) => {
      const errorLine = currentChunk * CHUNK_SIZE + (errorDetail.row + 2);
      console.error(
        `[${errorDetail.type === 'create' ? 'Create' : 'Update'} Error - @Row ${errorLine}] Code ${errorDetail.statusCode} -> ${JSON.stringify(errorDetail.error)}`.red,
      );
    });
  }

  static chunkHandleError(error) {
    console.error('Error while uploading chunk:', error.message);
    if (error.response) {
      console.error('Server Response:', error.response.data);
    }
    return { created: 0, updated: 0, errors: [] };
  }

  static chunkResponseData(data) {
    const { created, updated, errors } = data;
    return {
      created: created.length,
      updated: updated.length,
      errors,
    };
  }

  static getProfile(domain) {
    const configDirectory = path.join(__dirname, '..', 'accounts', domain);

    if (!fs.existsSync(path.join(configDirectory, 'profile.json'))) {
      console.error(
        `No credentials found for domain ${domain}. Please sign in first.`,
      );
      return;
    }

    const profile = JSON.parse(
      fs.readFileSync(path.join(configDirectory, 'profile.json'), 'utf8'),
    );

    return profile;
  }

  static readFileContent(filePath) {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    console.error(
      `File not found at ${filePath}. Using empty string as fallback.`,
    );
    return '';
  }
};
