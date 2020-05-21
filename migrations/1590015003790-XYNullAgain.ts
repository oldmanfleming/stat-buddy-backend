import { MigrationInterface, QueryRunner } from 'typeorm';

export class XYNullAgain1590015003790 implements MigrationInterface {
	name: string = 'XYNullAgain1590015003790';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "x" DROP NOT NULL`, undefined);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "y" DROP NOT NULL`, undefined);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "y" SET NOT NULL`, undefined);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "x" SET NOT NULL`, undefined);
	}
}
