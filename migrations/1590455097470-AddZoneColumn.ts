import {MigrationInterface, QueryRunner} from "typeorm";

export class AddZoneColumn1590455097470 implements MigrationInterface {
    name = 'AddZoneColumn1590455097470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "zone" character varying`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "zone"`, undefined);
    }

}
