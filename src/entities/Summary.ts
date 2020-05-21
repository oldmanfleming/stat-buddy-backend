import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('summaries')
export class Summary {
	@PrimaryColumn()
	id!: number;

	@Column({ type: 'timestamp' })
	timestamp!: Date;

	@Column()
	gamePk!: number;

	@Column()
	venue!: string;

	@Column()
	opposingTeamId!: number;

	@Column()
	win!: number;

	@Column()
	tie!: number;

	@Column()
	loss!: number;

	@Column()
	otWin!: number;

	@Column()
	otLoss!: number;

	@Column()
	soWin!: number;

	@Column()
	soLoss!: number;

	@Column()
	points!: number;

	@Column()
	goalsFor!: number;

	@Column()
	goalsAgainst!: number;

	@Column()
	teamId!: number;

	@Column()
	timeOnIce!: number;

	@Column()
	evenTimeOnIce!: number;

	@Column()
	powerPlayTimeOnIce!: number;

	@Column()
	shortHandedTimeOnIce!: number;

	@Column()
	decision!: number;

	@Column()
	started!: number;
}
