const fs = require('fs');

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
