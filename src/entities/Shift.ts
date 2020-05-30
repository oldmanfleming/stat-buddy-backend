import { Entity, PrimaryColumn, Column, ManyToOne, Index } from 'typeorm';
import { Player } from './Player';
import { Team } from './Team';

@Entity('shifts')
@Index(['timestamp', 'startTime', 'endTime', 'gameType', 'teamStrength', 'opposingStrength', 'teamScore', 'opposingTeamScore'])
export class Shift {
	@Column({ type: 'timestamp' })
	timestamp!: Date;

	@PrimaryColumn()
	gamePk!: number;

	@Column()
	gameType!: string;

	@ManyToOne(() => Player, (player: Player) => player.id)
	@PrimaryColumn({ name: 'playerId' })
	playerId!: number;

	@Column()
	isHome!: boolean;

	@ManyToOne(() => Team, (team: Team) => team.id)
	@Column({ name: 'teamId' })
	teamId!: number;

	@ManyToOne(() => Team, (team: Team) => team.id)
	@Column({ name: 'opposingTeamId' })
	opposingTeamId!: number;

	@Column()
	teamStrength!: number;

	@Column()
	opposingStrength!: number;

	@Column()
	teamScore!: number;

	@Column()
	opposingTeamScore!: number;

	@PrimaryColumn()
	startTime!: number;

	@Column()
	endTime!: number;

	@Column()
	length!: number;
}
