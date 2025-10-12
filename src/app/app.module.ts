import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/context/database/database.module';
import config from 'src/context/shared/config';
import { LoggerModule } from 'src/context/shared/logger';
// entry point
import { AuthModule } from 'src/context/auth/auth.module';
import { PdfModule } from 'src/context/pdf/pdf.module';
import { UsersModule } from './users/user.module';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    DeviceModule,
    UsersModule,
    PdfModule,
    LoggerModule,
    AuthModule,
  ],
})
export class AppModule {}
