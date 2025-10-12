import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1758244888767 implements MigrationInterface {
    name = 'Migration1758244888767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_37c3356b21e66a124392ed10970"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_37c3356b21e66a124392ed10970" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_37c3356b21e66a124392ed10970"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_37c3356b21e66a124392ed10970" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
