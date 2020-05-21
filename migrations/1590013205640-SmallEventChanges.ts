import { MigrationInterface, QueryRunner } from 'typeorm';

export class SmallEventChanges1590013205640 implements MigrationInterface {
	name: string = 'SmallEventChanges1590013205640';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "teamStatus"`, undefined);
		await queryRunner.query(`ALTER TABLE "events" ADD "isHome" boolean NOT NULL`, undefined);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "x" SET NOT NULL`, undefined);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "y" SET NOT NULL`, undefined);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "y" DROP NOT NULL`, undefined);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "x" DROP NOT NULL`, undefined);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "isHome"`, undefined);
		await queryRunner.query(`ALTER TABLE "events" ADD "teamStatus" character varying NOT NULL`, undefined);
	}
}
