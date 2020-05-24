import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialSchema1590269718290 implements MigrationInterface {
    name = 'InitialSchema1590269718290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "teams" ("id" integer NOT NULL, "name" character varying NOT NULL, "venue" character varying NOT NULL, "city" character varying NOT NULL, "abbreviation" character varying NOT NULL, "teamName" character varying NOT NULL, "locationName" character varying NOT NULL, "division" character varying NOT NULL, "divisionId" integer NOT NULL, "conference" character varying NOT NULL, "conferenceId" integer NOT NULL, CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "players" ("id" integer NOT NULL, "fullName" character varying NOT NULL, "firstName" character varying NOT NULL, "primaryNumber" integer, "birthDate" character varying NOT NULL, "currentAge" integer, "birthCity" character varying NOT NULL, "birthCountry" character varying NOT NULL, "nationality" character varying NOT NULL, "height" character varying NOT NULL, "weight" integer NOT NULL, "active" boolean NOT NULL, "alternateCaptain" boolean, "captain" boolean, "rookie" boolean NOT NULL, "shootsCatches" character varying NOT NULL, "rosterStatus" character varying NOT NULL, "currentTeamId" integer, "primaryPosition" character varying NOT NULL, CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "events" ("gamePk" integer NOT NULL, "gameType" character varying NOT NULL, "timestamp" TIMESTAMP NOT NULL, "eventIdx" integer NOT NULL, "eventType" character varying NOT NULL, "secondaryType" character varying NOT NULL, "playTime" integer NOT NULL, "playerId" integer NOT NULL, "playerType" character varying NOT NULL, "playerHandedness" character varying, "players" text NOT NULL, "opposingPlayers" text NOT NULL, "isHome" boolean NOT NULL, "teamStrength" integer NOT NULL, "opposingStrength" integer NOT NULL, "teamScore" integer NOT NULL, "opposingTeamScore" integer NOT NULL, "x" integer, "y" integer, "gameWinningGoal" boolean, "emptyNet" boolean, "penaltySeverity" character varying, "penaltyMinutes" integer, "teamId" integer, "opposingTeamId" integer, CONSTRAINT "PK_a253c19b723075c2ce6cabd4a98" PRIMARY KEY ("gamePk", "eventIdx", "playerId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_1defaa6962a26b4dd607bd1171" ON "events" ("timestamp", "eventType", "playTime", "gameType", "teamStrength", "opposingStrength") `, undefined);
        await queryRunner.query(`CREATE TABLE "summaries" ("id" integer NOT NULL, "timestamp" TIMESTAMP NOT NULL, "gamePk" integer NOT NULL, "venue" character varying NOT NULL, "opposingTeamId" integer NOT NULL, "win" integer NOT NULL, "tie" integer NOT NULL, "loss" integer NOT NULL, "otWin" integer NOT NULL, "otLoss" integer NOT NULL, "soWin" integer NOT NULL, "soLoss" integer NOT NULL, "points" integer NOT NULL, "goalsFor" integer NOT NULL, "goalsAgainst" integer NOT NULL, "teamId" integer NOT NULL, "timeOnIce" integer NOT NULL, "evenTimeOnIce" integer NOT NULL, "powerPlayTimeOnIce" integer NOT NULL, "shortHandedTimeOnIce" integer NOT NULL, "decision" integer NOT NULL, "started" integer NOT NULL, CONSTRAINT "PK_448e2a87db98ce2a6ee8946f392" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_5d35bdd3de07c0fce1d26fe1b16" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_7b1e7416989fae901b97f08c729" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_277afdc77aa4158bb2ee541b3c4" FOREIGN KEY ("opposingTeamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_277afdc77aa4158bb2ee541b3c4"`, undefined);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_7b1e7416989fae901b97f08c729"`, undefined);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_5d35bdd3de07c0fce1d26fe1b16"`, undefined);
        await queryRunner.query(`DROP TABLE "summaries"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_1defaa6962a26b4dd607bd1171"`, undefined);
        await queryRunner.query(`DROP TABLE "events"`, undefined);
        await queryRunner.query(`DROP TABLE "players"`, undefined);
        await queryRunner.query(`DROP TABLE "teams"`, undefined);
    }

}
