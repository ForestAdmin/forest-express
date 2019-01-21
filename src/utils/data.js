exports.find = (data, path) => {
  if (data) {
    if (path) {
      const keys = path.split('.');
      let value = data;
      // eslint-disable-next-line consistent-return
      keys.forEach((key) => {
        if (key in value && value[key]) {
          value = value[key];
        } else {
          value = null;
        }
      });
      return value;
    }
  }
  return data;
};
