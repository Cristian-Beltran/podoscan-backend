import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1764201962533 implements MigrationInterface {
    name = 'Migration1764201962533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appoinment" ADD "forefootWidthMm" double precision`);
        await queryRunner.query(`ALTER TABLE "appoinment" ADD "isthmusWidthMm" double precision`);
        await queryRunner.query(`ALTER TABLE "appoinment" ADD "chippauxSmirakIndex" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appoinment" DROP COLUMN "chippauxSmirakIndex"`);
        await queryRunner.query(`ALTER TABLE "appoinment" DROP COLUMN "isthmusWidthMm"`);
        await queryRunner.query(`ALTER TABLE "appoinment" DROP COLUMN "forefootWidthMm"`);
    }

}
