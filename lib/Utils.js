module.exports = class Utils {
  static sanitizeRecords(records) {
    return records.map((record) => {
      Object.keys(record).forEach((key) => {
        if (record[key] === "") {
          delete record[key];
        }
      });
      return record;
    });
  }
};
