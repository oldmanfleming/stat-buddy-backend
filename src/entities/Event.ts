import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Team } from './Team';
import { Player } from './Player';

export enum EventType {
	Hit = 'HIT',
	OnIceHit = 'ON_ICE_HIT',
	HitAgainst = 'HIT_AGAINST',
	OnIceHitAgainst = 'ON_ICE_HIT_AGAINST',
	BlockedShot = 'BLOCKED_SHOT',
	OnIceBlockedShot = 'ON_ICE_BLOCKED_SHOT',
	GoalieOnIceBlockedShot = 'GOALIE_ON_ICE_BLOCKED_SHOT',
	ShotBlocked = 'SHOT_BLOCKED',
	OnIceShotBlocked = 'ON_ICE_SHOT_BLOCKED',
	ShotMissed = 'SHOT_MISSED',
	OnIceShotMissed = 'ON_ICE_SHOT_MISSED',
	OnIceMissedShot = 'ON_ICE_MISSED_SHOT',
	GoalieOnIceMissedShot = 'GOALIE_ON_ICE_MISSED_SHOT',
	Shot = 'SHOT',
	OnIceShot = 'ON_ICE_SHOT',
	Save = 'SAVE',
	OnIceSave = 'ON_ICE_SAVE',
	FaceoffWin = 'FACEOFF_WIN',
	OnIceFaceoffWin = 'ON_ICE_FACEOFF_WIN',
	FaceoffLoss = 'FACEOFF_LOSS',
	OnIceFaceoffLoss = 'ON_ICE_FACEOFF_LOSS',
	PenaltyAgainst = 'PENALTY_AGAINST',
	OnIcePenaltyAgainst = 'ON_ICE_PENALTY_AGAINST',
	PenaltyFor = 'PENALTY_FOR',
	OnIcePenaltyFor = 'ON_ICE_PENALTY_FOR',
	Goal = 'GOAL',
	Assist = 'ASSIST',
	OnIceGoal = 'ON_ICE_GOAL',
	GoalAllowed = 'GOAL_ALLOWED',
	OnIceGoalAllowed = 'ON_ICE_GOAL_ALLOWED',
	Takeaway = 'TAKEAWAY',
	OnIceTakeaway = 'ON_ICE_TAKEAWAY',
	Giveaway = 'GIVEAWAY',
	OnIceGiveaway = 'ON_ICE_GIVEAWAY',
	Stop = 'STOP',
}

@Entity('events')
@Index(['timestamp', 'eventType', 'playTime', 'teamStrength', 'opposingStrength'])
export class Event {
	@PrimaryColumn('int')
	gamePk!: number;

	@PrimaryColumn('int')
	eventIdx!: number;

	@Column()
	eventType!: string;

	@Column()
	secondaryType!: string;

	@Column()
	playTime!: number;

	@Column({ type: 'timestamp' })
	timestamp!: Date;

	@ManyToOne(() => Player, (player: Player) => player.id)
	@JoinColumn({ name: 'playerId' })
	@PrimaryColumn('int')
	playerId!: number;

	@Column()
	playerType!: string;

	@Column()
	playerHandedness!: string;

	@Column({ type: 'simple-array' })
	players!: number[];

	@Column({ type: 'simple-array' })
	opposingPlayers!: number[];

	@ManyToOne(() => Team, (team: Team) => team.id)
	@JoinColumn({ name: 'teamId' })
	teamId!: number;

	@Column()
	isHome!: boolean;

	@ManyToOne(() => Team, (team: Team) => team.id)
	@JoinColumn({ name: 'opposingTeamId' })
	opposingTeamId!: number;

	@Column()
	teamStrength!: number;

	@Column()
	opposingStrength!: number;

	@Column()
	teamScore!: number;

	@Column()
	opposingTeamScore!: number;

	@Column({ nullable: true })
	x?: number;

	@Column({ nullable: true })
	y?: number;

	@Column({ nullable: true })
	gameWinningGoal?: boolean;

	@Column({ nullable: true })
	emptyNet?: boolean;

	@Column({ nullable: true })
	penaltySeverity?: string;

	@Column({ nullable: true })
	penaltyMinutes?: number;
}
