import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1758244436913 implements MigrationInterface {
    name = 'Migration1758244436913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."devices_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'DELETED')`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "status" "public"."devices_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "patientId" uuid`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "UQ_37c3356b21e66a124392ed10970" UNIQUE ("patientId")`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_37c3356b21e66a124392ed10970" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_37c3356b21e66a124392ed10970"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "UQ_37c3356b21e66a124392ed10970"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "patientId"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."devices_status_enum"`);
    }

}
