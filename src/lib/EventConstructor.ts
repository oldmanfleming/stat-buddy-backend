import Logger from '../Logger';
import { Event, EventType } from '../entities/Event';
import GameEvents, { Team, PlayerStats, Stats, GoalieStats, SkaterStats } from './interfaces/GameEvent';

function parseBoxScore(gamePk: number, gameType: string, timestamp: Date, team: Team, isHome: boolean, opposingTeamId: number): Event[] {
	const events: Event[] = [];
	let eventIdx: number = 0;
	Object.keys(team.players).forEach((key: string) => {
		const player: PlayerStats = team.players[key];
		const playerStats: Stats = player.stats;

		const baseEvent: Event = Object.assign(new Event(), {
			gamePk,
			gameType,
			timestamp,
			eventIdx,
			secondaryType: '',
			playTime: 0,
			playerId: player.person.id,
			playerType: player.position.abbreviation,
			playerHandedness: player.person.shootsCatches,
			players: [],
			opposingPlayers: [],
			isHome,
			teamId: team.team.id,
			opposingTeamId,
			teamStrength: 5,
			opposingStrength: 5,
			teamScore: 0,
			opposingTeamScore: 0,
			x: null,
			y: null,
			gameWinningGoal: null,
			emptyNet: null,
			penaltySeverity: null,
			penaltyMinutes: null,
		});

		if (playerStats.goalieStats) {
			const goalieStats: GoalieStats = playerStats.goalieStats;
			for (let i: number = 0; i < goalieStats.powerPlaySaves; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Save;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 4;
				events.push(event);
			}
			for (let i: number = 0; i < goalieStats.shortHandedSaves; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Save;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 4;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < goalieStats.evenSaves; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Save;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}

			// Goals Allowed
			for (let i: number = 0; i < goalieStats.powerPlayShotsAgainst - goalieStats.powerPlaySaves; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.GoalAllowed;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 4;
				events.push(event);
			}
			for (let i: number = 0; i < goalieStats.evenShotsAgainst - goalieStats.evenSaves; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.GoalAllowed;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < goalieStats.shortHandedShotsAgainst - goalieStats.shortHandedSaves; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.GoalAllowed;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 4;
				event.teamStrength = 5;
				events.push(event);
			}
		} else if (playerStats.skaterStats) {
			const skaterStats: SkaterStats = playerStats.skaterStats;
			for (let i: number = 0; i < skaterStats.goals - skaterStats.powerPlayGoals - skaterStats.shortHandedGoals; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Goal;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.powerPlayGoals; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Goal;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 4;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.shortHandedGoals; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Goal;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 4;
				events.push(event);
			}
			// Assists
			for (let i: number = 0; i < skaterStats.assists - skaterStats.powerPlayAssists - skaterStats.shortHandedAssists; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Assist;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.powerPlayAssists; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Assist;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 4;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.shortHandedAssists; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Assist;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 4;
				events.push(event);
			}

			// Others
			for (let i: number = 0; i < skaterStats.shots - skaterStats.goals - skaterStats.powerPlayGoals - skaterStats.shortHandedGoals; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Shot;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.hits; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Hit;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.faceOffWins; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.FaceoffWin;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.faceoffTaken - skaterStats.faceOffWins; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.FaceoffLoss;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.takeaways; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Takeaway;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.giveaways; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.Giveaway;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
			for (let i: number = 0; i < skaterStats.blocked; i += 1) {
				const event: Event = Object.assign(new Event(), baseEvent);
				event.eventType = EventType.BlockedShot;
				event.eventIdx = eventIdx++;
				event.opposingStrength = 5;
				event.teamStrength = 5;
				events.push(event);
			}
		}
	});
	return events;
}

export function constructEvents(gameEvents: GameEvents): Event[] {
	Logger.info('***Constructing Events***');

	const gamePk: number = gameEvents.data.gamePk;
	const timestamp: Date = new Date(gameEvents.data.gameData.datetime.dateTime);
	const gameType: string = gameEvents.data.gameData.game.type;

	const homeTeam: Team = gameEvents.data.liveData.boxscore.teams.home;
	const awayTeam: Team = gameEvents.data.liveData.boxscore.teams.away;

	const homeEvents: Event[] = parseBoxScore(gamePk, gameType, timestamp, homeTeam, true, awayTeam.team.id);
	const awayEvents: Event[] = parseBoxScore(gamePk, gameType, timestamp, awayTeam, false, homeTeam.team.id);

	return [...homeEvents, ...awayEvents];
}
