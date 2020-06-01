import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovingEventPrefix1590863350833 implements MigrationInterface {
	name: string = 'RemovingEventPrefix1590863350833';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "eventType" TO "type"`, undefined);
		await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "eventIdx" TO "idx"`, undefined);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "type" TO "eventType"`, undefined);
		await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "idx" TO "eventIdx"`, undefined);
	}
}
