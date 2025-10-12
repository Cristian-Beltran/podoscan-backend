import { Controller, Post, Headers, HttpException } from '@nestjs/common';
import { exec } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);

@Controller('admin-db')
export class MigrationController {
  @Post('migrate')
  async runMigration(@Headers('x-secret') token: string) {
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET;
    if (!MIGRATION_SECRET || token !== MIGRATION_SECRET) {
      throw new HttpException('Forbidden', 403);
    }

    try {
      const { stdout, stderr } = await execAsync('pnpm run migration:run:prod');
      return {
        success: true,
        command: 'pnpm run migration:run',
        stdout,
        stderr,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'Migration failed',
          error: error.message,
          stderr: error.stderr,
        },
        500,
      );
    }
  }
}
