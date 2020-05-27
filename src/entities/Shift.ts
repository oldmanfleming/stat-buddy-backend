import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Player } from './Player';
import { Team } from './Team';

@Entity('shifts')
export class Shift {
	@Column({ type: 'timestamp' })
	timestamp!: Date;

	@PrimaryColumn()
	gamePk!: number;

	@ManyToOne(() => Player, (player: Player) => player.id)
	@PrimaryColumn({ name: 'playerId' })
	playerId!: number;

	@PrimaryColumn()
	shiftId!: number;

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
	startTime!: number;

	@Column()
	endTime!: number;

	@Column()
	length!: number;
}
