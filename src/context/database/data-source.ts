import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

config();
const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  port: configService.get('DB_PORT'),
  host: configService.get('DB_HOST'),
  synchronize: false,
  logging: true,
  entities: [
    path.resolve(__dirname, '..', '..', 'app', '**', '*.entity.{ts,js}'),
  ],
  migrations: [path.resolve(__dirname, 'migrations', '*{.ts,.js}')],
  migrationsTableName: 'migrations',
});
