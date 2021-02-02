export default {
  port: parseInt(process.env.PORT, 10),
  secret: {
    API_ACCESS_TOKEN_GAME: process.env.API_ACCESS_TOKEN_GAME,
    API_ACCESS_TOKEN_MAIN: process.env.API_ACCESS_TOKEN_MAIN,
  },
  database: {
    redis: {
      uri: process.env.REDIS_URI,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    monogo: process.env.MONGO_URI,
  },

  jwt: {
    token: process.env.TOKEN_JWT_OTP,
  },

  services: {
    main: process.env.MAIN_URI,
  },
};
