function ServiceUrlGetter() {
  this.perform = function() {
    return process.env.FOREST_URL || 'https://api.forestadmin.com';
  };
}

module.exports = ServiceUrlGetter;
