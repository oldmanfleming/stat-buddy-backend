import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventIndex1590013530575 implements MigrationInterface {
	name: string = 'EventIndex1590013530575';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_b35cd199ac6ee85b760b7bc538" ON "events" ("timestamp", "eventType", "playTime", "teamStrength", "opposingStrength") `,
			undefined,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_b35cd199ac6ee85b760b7bc538"`, undefined);
	}
}
