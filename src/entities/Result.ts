import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Player } from './Player';
import { Team } from './Team';

@Entity('results')
export class Result {
	@Column({ type: 'timestamp' })
	timestamp!: Date;

	@PrimaryColumn()
	gamePk!: number;

	@Column()
	venue!: string;

	@Column()
	isHome!: boolean;

	@ManyToOne(() => Player, (player: Player) => player.id)
	@PrimaryColumn({ name: 'playerId', nullable: true })
	playerId!: number;

	@ManyToOne(() => Team, (team: Team) => team.id)
	@PrimaryColumn({ name: 'teamId' })
	teamId!: number;

	@ManyToOne(() => Team, (team: Team) => team.id)
	@Column({ name: 'opposingTeamId' })
	opposingTeamId!: number;

	@Column()
	teamScore!: number;

	@Column()
	opposingTeamScore!: number;

	@Column()
	result!: string;

	@Column()
	points!: number;

	@Column({ nullable: true })
	decision!: boolean;

	@Column({ nullable: true })
	started!: boolean;
}
