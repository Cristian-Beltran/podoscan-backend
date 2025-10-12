import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1758158309024 implements MigrationInterface {
    name = 'Migration1758158309024'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_type_enum" AS ENUM('patient', 'doctor', 'family')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'DELETED')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullname" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "address" character varying, "type" "public"."users_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."users_status_enum" NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "family_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, CONSTRAINT "REL_ccda8487d562e954d3c93bfbd0" UNIQUE ("userId"), CONSTRAINT "PK_186da7c7fcbf23775fdd888a747" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "serialNumber" character varying NOT NULL, "model" character varying NOT NULL, CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, CONSTRAINT "REL_2c24c3490a26d04b0d70f92057" UNIQUE ("userId"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "session_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lungCapacity" double precision NOT NULL, "pulse" integer NOT NULL, "oxygenSaturation" integer NOT NULL, "recordedAt" TIMESTAMP NOT NULL DEFAULT now(), "sessionId" uuid, CONSTRAINT "PK_791c7014ec3aa653c58410c14e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startedAt" TIMESTAMP NOT NULL DEFAULT now(), "endedAt" TIMESTAMP, "patientId" uuid, "deviceId" uuid, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doctors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "specialty" character varying, "licenseNumber" character varying, "userId" uuid, CONSTRAINT "REL_55651e05e46413d510215535ed" UNIQUE ("userId"), CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "family_patients" ("familyMembersId" uuid NOT NULL, "patientsId" uuid NOT NULL, CONSTRAINT "PK_cd4dfa677d3ff76c4638512a47c" PRIMARY KEY ("familyMembersId", "patientsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_34a9e0939afa2c33c87686a6ee" ON "family_patients" ("familyMembersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f5c0bb99890eb945d343e1bff8" ON "family_patients" ("patientsId") `);
        await queryRunner.query(`ALTER TABLE "family_members" ADD CONSTRAINT "FK_ccda8487d562e954d3c93bfbd0c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_a9af6b7e40b0b2f0ba730cd4c21" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_fd11aa87698d5a784713b9de978" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD CONSTRAINT "FK_55651e05e46413d510215535edf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "family_patients" ADD CONSTRAINT "FK_34a9e0939afa2c33c87686a6eea" FOREIGN KEY ("familyMembersId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "family_patients" ADD CONSTRAINT "FK_f5c0bb99890eb945d343e1bff87" FOREIGN KEY ("patientsId") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "family_patients" DROP CONSTRAINT "FK_f5c0bb99890eb945d343e1bff87"`);
        await queryRunner.query(`ALTER TABLE "family_patients" DROP CONSTRAINT "FK_34a9e0939afa2c33c87686a6eea"`);
        await queryRunner.query(`ALTER TABLE "doctors" DROP CONSTRAINT "FK_55651e05e46413d510215535edf"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_fd11aa87698d5a784713b9de978"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_a9af6b7e40b0b2f0ba730cd4c21"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a"`);
        await queryRunner.query(`ALTER TABLE "family_members" DROP CONSTRAINT "FK_ccda8487d562e954d3c93bfbd0c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5c0bb99890eb945d343e1bff8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34a9e0939afa2c33c87686a6ee"`);
        await queryRunner.query(`DROP TABLE "family_patients"`);
        await queryRunner.query(`DROP TABLE "doctors"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "session_data"`);
        await queryRunner.query(`DROP TABLE "patients"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP TABLE "family_members"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
    }

}
