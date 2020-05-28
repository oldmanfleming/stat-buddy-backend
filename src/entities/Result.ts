import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './Player';
import { Team } from './Team';

export enum ResultType {
	Win = 'WIN',
	Loss = 'LOSS',
	OTLoss = 'OT_LOSS',
}

@Entity('results')
export class Result {
	@Column({ type: 'timestamp' })
	timestamp!: Date;

	@PrimaryColumn()
	gamePk!: number;

	@Column()
	isHome!: boolean;

	@ManyToOne(() => Team, (team: Team) => team.id)
	@PrimaryColumn()
	@JoinColumn({ name: 'teamId' })
	teamId!: number;

	@ManyToOne(() => Team, (team: Team) => team.id)
	@JoinColumn({ name: 'opposingTeamId' })
	opposingTeamId!: number;

	@Column()
	teamScore!: number;

	@Column()
	opposingTeamScore!: number;

	@Column()
	resultType!: string;

	@Column()
	points!: number;

	@ManyToOne(() => Player, (player: Player) => player.id)
	@JoinColumn({ name: 'goalieStartId' })
	goalieStartId!: number;

	@ManyToOne(() => Player, (player: Player) => player.id)
	@JoinColumn({ name: 'goalieDecisionId' })
	goalieDecisionId!: number;
}
