import { EventCounts } from '../repositories/EventRepository';
import { ShiftCounts } from '../repositories/ShiftRepository';

export class PlayerStats {
	gamesPlayed: number;
	timeOnIce: number;
	goals: number;
	assists: number;
	points: number;
	shots: number;
	shotsBlocked: number;
	shotsMissed: number;
	shootingPercentage: number;
	totalShotAttempts: number;
	faceoffWins: number;
	faceoffLosses: number;
	faceoffPercentage: number;
	blockedShots: number;
	hits: number;
	hitsAgainst: number;
	takeaways: number;
	giveaways: number;
	corsiFor: number;
	corsiAgainst: number;
	corsiForPercentage: number;
	fenwickFor: number;
	fenwickAgainst: number;
	fenwickForPercentage: number;
	onIceGoalsFor: number;
	onIceShootingPercentage: number;
	onIceGoalsAllowed: number;
	onIceSavePercentage: number;
	PDO: number;

	constructor(eventCounts: EventCounts, shiftCounts: ShiftCounts) {
		this.gamesPlayed = shiftCounts.gamesPlayed;
		this.timeOnIce = shiftCounts.timeOnIce / 60;
		this.goals = eventCounts.GOAL;
		this.assists = eventCounts.ASSIST;
		this.points = eventCounts.GOAL + eventCounts.ASSIST;
		this.shots = eventCounts.GOAL + eventCounts.SHOT;
		this.shootingPercentage = eventCounts.GOAL / (eventCounts.GOAL + eventCounts.SHOT);
		this.shotsBlocked = eventCounts.SHOT_BLOCKED;
		this.shotsMissed = eventCounts.SHOT_MISSED;
		this.totalShotAttempts = eventCounts.GOAL + eventCounts.SHOT + eventCounts.SHOT_BLOCKED + eventCounts.SHOT_MISSED;
		this.faceoffWins = eventCounts.FACEOFF_WIN;
		this.faceoffLosses = eventCounts.FACEOFF_LOSS;
		this.faceoffPercentage = eventCounts.FACEOFF_WIN / (eventCounts.FACEOFF_WIN + eventCounts.FACEOFF_LOSS);
		this.blockedShots = eventCounts.BLOCKED_SHOT;
		this.hits = eventCounts.HIT;
		this.hitsAgainst = eventCounts.HIT_AGAINST;
		this.takeaways = eventCounts.TAKEAWAY;
		this.giveaways = eventCounts.GIVEAWAY;
		this.corsiFor =
			eventCounts.GOAL +
			eventCounts.ASSIST +
			eventCounts.SHOT +
			eventCounts.SHOT_MISSED +
			eventCounts.SHOT_BLOCKED +
			eventCounts.ON_ICE_GOAL +
			eventCounts.ON_ICE_SHOT +
			eventCounts.ON_ICE_SHOT_MISSED +
			eventCounts.ON_ICE_SHOT_BLOCKED;
		this.corsiAgainst =
			eventCounts.BLOCKED_SHOT + eventCounts.ON_ICE_GOAL_ALLOWED + eventCounts.ON_ICE_SAVE + eventCounts.ON_ICE_MISSED_SHOT + eventCounts.ON_ICE_BLOCKED_SHOT;
		this.corsiForPercentage = this.corsiFor / (this.corsiFor + this.corsiAgainst);
		this.fenwickFor =
			eventCounts.GOAL +
			eventCounts.ASSIST +
			eventCounts.SHOT +
			eventCounts.SHOT_MISSED +
			eventCounts.ON_ICE_GOAL +
			eventCounts.ON_ICE_SHOT +
			eventCounts.ON_ICE_SHOT_MISSED;
		this.fenwickAgainst = eventCounts.ON_ICE_GOAL_ALLOWED + eventCounts.ON_ICE_SAVE + eventCounts.ON_ICE_MISSED_SHOT;
		this.fenwickForPercentage = this.fenwickFor / (this.fenwickFor + this.fenwickAgainst);
		this.onIceGoalsFor = eventCounts.GOAL + eventCounts.ASSIST + eventCounts.ON_ICE_GOAL;
		this.onIceShootingPercentage = this.onIceGoalsFor / (this.onIceGoalsFor + eventCounts.SHOT + eventCounts.ON_ICE_SHOT);
		this.onIceGoalsAllowed = eventCounts.ON_ICE_GOAL_ALLOWED;
		this.onIceSavePercentage = eventCounts.ON_ICE_SAVE / (eventCounts.ON_ICE_SAVE + eventCounts.ON_ICE_GOAL_ALLOWED);
		this.PDO = this.onIceShootingPercentage + this.onIceSavePercentage;
	}
}
