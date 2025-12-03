export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/immobilier_auth',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_me_dev_secret',
    expiresIn: process.env.JWT_EXP || '15m',
  },
  refresh: {
    expDays: parseInt(process.env.REFRESH_EXP_DAYS || '30', 10),
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT || '12', 10),
  },
});
