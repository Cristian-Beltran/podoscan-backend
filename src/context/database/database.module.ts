import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from 'src/context/shared/config';
import { ConfigType } from '@nestjs/config';
import { MigrationController } from './database.controller';
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        const { user, host, name, password, port } = configService.database;
        return {
          type: 'postgres',
          host,
          port,
          username: user,
          password,
          database: name,
          autoLoadEntities: true,
        };
      },
    }),
  ],
  controllers: [MigrationController],
})
export class DatabaseModule {}
