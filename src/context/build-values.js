module.exports = (context) =>
  context
    .addInstance('env', () => ({
      ...process.env,
      FOREST_URL: process.env.FOREST_URL || 'https://api.forestadmin.com',
      JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
      NODE_ENV: ['dev', 'development'].includes(process.env.NODE_ENV)
        ? 'development'
        : 'production',
      APPLICATION_URL: process.env.APPLICATION_URL || `http://localhost:${process.env.APPLICATION_PORT || 3310}`,
    }))
    .addValue('forestUrl', process.env.FOREST_URL || 'https://api.forestadmin.com');
