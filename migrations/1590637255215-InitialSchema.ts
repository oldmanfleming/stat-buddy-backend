import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialSchema1590637255215 implements MigrationInterface {
    name = 'InitialSchema1590637255215'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "teams" ("id" integer NOT NULL, "name" character varying NOT NULL, "venue" character varying NOT NULL, "city" character varying NOT NULL, "abbreviation" character varying NOT NULL, "teamName" character varying NOT NULL, "locationName" character varying NOT NULL, "division" character varying NOT NULL, "divisionId" integer NOT NULL, "conference" character varying NOT NULL, "conferenceId" integer NOT NULL, CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "players" ("id" integer NOT NULL, "fullName" character varying NOT NULL, "firstName" character varying NOT NULL, "primaryNumber" integer, "birthDate" character varying NOT NULL, "currentAge" integer, "birthCity" character varying NOT NULL, "birthCountry" character varying NOT NULL, "nationality" character varying NOT NULL, "height" character varying NOT NULL, "weight" integer NOT NULL, "active" boolean NOT NULL, "alternateCaptain" boolean, "captain" boolean, "rookie" boolean NOT NULL, "shootsCatches" character varying NOT NULL, "rosterStatus" character varying NOT NULL, "currentTeamId" integer, "primaryPosition" character varying NOT NULL, CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "events" ("gamePk" integer NOT NULL, "gameType" character varying NOT NULL, "timestamp" TIMESTAMP NOT NULL, "eventIdx" integer NOT NULL, "eventType" character varying NOT NULL, "secondaryType" character varying NOT NULL, "secondaryNumber" integer, "playTime" integer NOT NULL, "playerId" integer NOT NULL, "playerType" character varying NOT NULL, "playerHandedness" character varying NOT NULL DEFAULT '', "players" text NOT NULL, "opposingPlayers" text NOT NULL, "teamStrength" integer NOT NULL, "opposingStrength" integer NOT NULL, "teamScore" integer NOT NULL, "opposingTeamScore" integer NOT NULL, "isHome" boolean NOT NULL, "x" integer, "y" integer, "zone" character varying, "teamId" integer, "opposingTeamId" integer, CONSTRAINT "PK_a253c19b723075c2ce6cabd4a98" PRIMARY KEY ("gamePk", "eventIdx", "playerId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_1defaa6962a26b4dd607bd1171" ON "events" ("timestamp", "eventType", "playTime", "gameType", "teamStrength", "opposingStrength") `, undefined);
        await queryRunner.query(`CREATE TABLE "results" ("timestamp" TIMESTAMP NOT NULL, "gamePk" integer NOT NULL, "isHome" boolean NOT NULL, "teamId" integer NOT NULL, "teamScore" integer NOT NULL, "opposingTeamScore" integer NOT NULL, "resultType" character varying NOT NULL, "points" integer NOT NULL, "opposingTeamId" integer, "goalieStartId" integer, "goalieDecisionId" integer, CONSTRAINT "PK_bbbebcd6729594dd222bc736eea" PRIMARY KEY ("gamePk", "teamId"))`, undefined);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_5d35bdd3de07c0fce1d26fe1b16" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_7b1e7416989fae901b97f08c729" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_277afdc77aa4158bb2ee541b3c4" FOREIGN KEY ("opposingTeamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_3d4a3f7a5ea710a68f4bd7596e8" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_9cc6f9ac385d58e63eedd48eb4d" FOREIGN KEY ("opposingTeamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_df91bbb41b0d04d676a3a569345" FOREIGN KEY ("goalieStartId") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_2b397ba4eceba755f5fb4ecf9f7" FOREIGN KEY ("goalieDecisionId") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_2b397ba4eceba755f5fb4ecf9f7"`, undefined);
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_df91bbb41b0d04d676a3a569345"`, undefined);
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_9cc6f9ac385d58e63eedd48eb4d"`, undefined);
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_3d4a3f7a5ea710a68f4bd7596e8"`, undefined);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_277afdc77aa4158bb2ee541b3c4"`, undefined);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_7b1e7416989fae901b97f08c729"`, undefined);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_5d35bdd3de07c0fce1d26fe1b16"`, undefined);
        await queryRunner.query(`DROP TABLE "results"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_1defaa6962a26b4dd607bd1171"`, undefined);
        await queryRunner.query(`DROP TABLE "events"`, undefined);
        await queryRunner.query(`DROP TABLE "players"`, undefined);
        await queryRunner.query(`DROP TABLE "teams"`, undefined);
    }

}
