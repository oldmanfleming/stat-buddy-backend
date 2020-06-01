import { Entity, PrimaryColumn, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Team } from './Team';
import { Player } from './Player';

export enum Zone {
	Defensive = 'DEFENSIVE',
	Neutral = 'NEUTRAL',
	Offensive = 'OFFENSIVE',
}

export enum EventType {
	Hit = 'HIT',
	OnIceHit = 'ON_ICE_HIT',
	HitAgainst = 'HIT_AGAINST',
	OnIceHitAgainst = 'ON_ICE_HIT_AGAINST',
	BlockedShot = 'BLOCKED_SHOT',
	OnIceBlockedShot = 'ON_ICE_BLOCKED_SHOT',
	ShotBlocked = 'SHOT_BLOCKED',
	OnIceShotBlocked = 'ON_ICE_SHOT_BLOCKED',
	ShotMissed = 'SHOT_MISSED',
	OnIceShotMissed = 'ON_ICE_SHOT_MISSED',
	OnIceMissedShot = 'ON_ICE_MISSED_SHOT',
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
	OnIceOffside = 'ON_ICE_OFFSIDE',
	OnIceIcing = 'ON_ICE_ICING',
	OnIcePuckOutOfPlay = 'ON_ICE_PUCK_OUT_OF_PLAY',
	ShootOutGoal = 'SHOOTOUT_GOAL',
	ShootOutGoalAllowed = 'SHOOTOUT_GOAL_ALLOWED',
	ShootOutShot = 'SHOOTOUT_SHOT',
	ShootOutSave = 'SHOOTOUT_SAVE',
	ShootOutMiss = 'SHOOTOUT_MISS',
	ShootOutOnIceMiss = 'SHOOTOUT_ON_ICE_MISS',
}

@Entity('events')
@Index(['timestamp', 'type', 'playTime', 'gameType', 'teamStrength', 'opposingStrength', 'teamScore', 'opposingTeamScore'])
export class Event {
	@PrimaryColumn('int')
	gamePk!: number;

	@Column()
	gameType!: string;

	@Column({ type: 'timestamp' })
	timestamp!: Date;

	@PrimaryColumn('int')
	idx!: number;

	@Column()
	type!: string;

	@Column()
	secondaryType!: string;

	@Column({ nullable: true })
	secondaryNumber!: number;

	@Column()
	playTime!: number;

	@ManyToOne(() => Player, (player: Player) => player.id)
	@PrimaryColumn({ type: 'int' })
	@JoinColumn({ name: 'playerId' })
	playerId!: number;

	@Column()
	playerType!: string;

	@Column({ default: '' })
	playerHandedness!: string;

	@Column({ type: 'simple-array' })
	players!: number[];

	@Column({ type: 'simple-array' })
	opposingPlayers!: number[];

	@ManyToOne(() => Team, (team: Team) => team.id)
	@JoinColumn({ name: 'teamId' })
	teamId!: number;

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

	@Column()
	isHome!: boolean;

	@Column({ nullable: true })
	x?: number;

	@Column({ nullable: true })
	y?: number;

	@Column({ nullable: true })
	zone?: string;
}
