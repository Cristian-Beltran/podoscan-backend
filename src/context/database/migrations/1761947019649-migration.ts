import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761947019649 implements MigrationInterface {
    name = 'Migration1761947019649'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" ADD "p4" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "p5" double precision NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "p5"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "p4"`);
    }

}
