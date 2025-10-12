import { registerAs } from '@nestjs/config';
export default registerAs('config', () => {
  return {
    database: {
      name: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) ?? 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
    },
    apiKey: process.env.API_KEY,
    jwtSecret: process.env.JWT_SECRET,
  };
});
