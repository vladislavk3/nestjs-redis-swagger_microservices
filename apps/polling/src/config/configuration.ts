export default {
  port: parseInt(process.env.PORT, 10),
  secret: {
    GAME_API_ACCESS_TOKEN: process.env.API_ACCESS_TOKEN_GAME,
  },
  database: {
    redis: process.env.REDIS_URI,
    monogo: process.env.MONGO_URI,
  },
  services: {
    game: process.env.GAME_URI,
  },
};
