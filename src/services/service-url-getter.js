function ServiceUrlGetter() {
  this.perform = () => process.env.FOREST_URL || 'https://api.forestadmin.com';
}

module.exports = ServiceUrlGetter;
