/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GameType, EventTypeId, PositionAbbreviation, PlayerType, PeriodType, Description } from './Constants';
import GameEvents, { AllPlay, Players, PlayerProfile2, Player, Teams3, PlayerStats } from './interfaces/GameEvent';
import GameShifts, { Shift } from './interfaces/GameShifts';
import { Event, EventType } from '../entities/Event';

export function timeToInt(time: string): number {
	let leadMinute: number;
	let smallMinute: number;
	let leadSecond: number;
	let smallSecond: number;
	if (time.length === 5) {
		leadMinute = parseInt(time[0], 10);
		smallMinute = parseInt(time[1], 10);
		leadSecond = parseInt(time[3], 10);
		smallSecond = parseInt(time[4], 10);
	} else {
		leadMinute = 0;
		smallMinute = parseInt(time[0], 10);
		leadSecond = parseInt(time[2], 10);
		smallSecond = parseInt(time[3], 10);
	}

	return leadMinute * 600 + smallMinute * 60 + leadSecond * 10 + smallSecond;
}

export function getTotalSeconds(period: number, time: string, gameType: string): number {
	let seconds: number = timeToInt(time);
	for (let i: number = 1; i < period; i += 1) {
		if (i < 4 || gameType === GameType.PlayoffGameType) {
			seconds += 1200;
		} else {
			seconds += 300;
		}
	}
	return seconds;
}

interface MetaInfo {
	gamePk: number;
	gameType: string;
	play: AllPlay;
	teams: Teams3;
	homePlayers: Set<number>;
	awayPlayers: Set<number>;
	homeGoalieId?: number;
	awayGoalieId?: number;
}

export function getEvent(eventType: EventType, playerId: number, metaInfo: MetaInfo): Event {
	// eslint-disable-next-line @typescript-eslint/typedef
	const { gamePk, gameType, play, teams, homePlayers, awayPlayers, homeGoalieId, awayGoalieId } = metaInfo;
	const event: Event = Object.assign(new Event(), {
		gamePk,
		gameType,
		eventIdx: play.about.eventIdx,
		timestamp: new Date(play.about.dateTime),
		playTime: getTotalSeconds(play.about.period, play.about.periodTime, gameType),
		eventType,
	});

	// player info
	let player: PlayerStats;
	let isHome: boolean = false;
	if (teams.home.players[`ID${playerId}`]) {
		player = teams.home.players[`ID${playerId}`];
		isHome = true;
	} else {
		player = teams.away.players[`ID${playerId}`];
		isHome = false;
	}

	event.playerId = player.person.id;
	event.playerType = player.position.abbreviation;
	event.playerHandedness = player.person.shootsCatches;

	// team info
	event.isHome = isHome;
	event.teamId = isHome ? teams.home.team.id : teams.away.team.id;
	event.opposingTeamId = isHome ? teams.away.team.id : teams.home.team.id;
	event.teamScore = isHome ? play.about.goals.home : play.about.goals.away;
	event.opposingTeamScore = isHome ? play.about.goals.away : play.about.goals.home;

	//strength
	event.teamStrength = isHome ? homePlayers.size : awayPlayers.size;
	event.opposingStrength = isHome ? awayPlayers.size : homePlayers.size;

	// final players on ice
	const homePlayersPlusGoalie: number[] = [...homePlayers];
	if (homeGoalieId) homePlayersPlusGoalie.push(homeGoalieId);
	const awayPlayersPlusGoalie: number[] = [...awayPlayers];
	if (awayGoalieId) awayPlayersPlusGoalie.push(awayGoalieId);
	event.players = isHome ? homePlayersPlusGoalie : awayPlayersPlusGoalie;
	event.opposingPlayers = isHome ? awayPlayersPlusGoalie : homePlayersPlusGoalie;

	// additional info
	event.secondaryType = play.result.secondaryType ?? play.result.description;
	event.gameWinningGoal = play.result.gameWinningGoal;
	event.emptyNet = play.result.emptyNet;
	event.penaltySeverity = play.result.penaltySeverity;
	event.penaltyMinutes = play.result.penaltyMinutes;
	event.x = play.coordinates.x;
	event.y = play.coordinates.y;

	return event;
}

export function getEvents(gamePk: number, gameEvents: GameEvents, gameShifts: GameShifts) {
	const events: Event[] = [];
	const gameType: string = gameEvents.data.gameData.game.type;
	const teams: Teams3 = gameEvents.data.liveData.boxscore.teams;
	const plays: AllPlay[] = gameEvents.data.liveData.plays.allPlays;
	const playerProfiles: Players = gameEvents.data.gameData.players;
	const shifts: Shift[] = gameShifts.data.data;

	for (const play of plays) {
		let homeGoalieId: number | undefined;
		const homePlayers: Set<number> = new Set();
		let awayGoalieId: number | undefined;
		const awayPlayers: Set<number> = new Set();
		for (const shift of shifts) {
			const startTime: number = getTotalSeconds(shift.period, shift.startTime, gameType);
			const endTime: number = getTotalSeconds(shift.period, shift.endTime, gameType);
			const playTime: number = getTotalSeconds(play.about.period, play.about.periodTime, gameType);
			const player: PlayerProfile2 | undefined = playerProfiles[`ID${shift.playerId}`];
			if (!player || !shift.duration) {
				continue;
			}
			if (
				(startTime < playTime && playTime < endTime) ||
				(play.result.eventTypeId !== EventTypeId.Faceoff && playTime === endTime && playTime !== startTime) ||
				(play.result.eventTypeId === EventTypeId.Faceoff && startTime === playTime && endTime !== playTime)
			) {
				if (shift.teamId === teams.home.team.id && player.primaryPosition.abbreviation === PositionAbbreviation.Goalie) {
					homeGoalieId = shift.playerId;
				} else if (shift.teamId === teams.home.team.id && player.primaryPosition.abbreviation !== PositionAbbreviation.Goalie) {
					homePlayers.add(shift.playerId);
				} else if (shift.teamId === teams.away.team.id && player.primaryPosition.abbreviation === PositionAbbreviation.Goalie) {
					awayGoalieId = shift.playerId;
				} else if (shift.teamId === teams.away.team.id && player.primaryPosition.abbreviation !== PositionAbbreviation.Goalie) {
					awayPlayers.add(shift.playerId);
				}
			}
		}

		const metaInfo: MetaInfo = {
			gamePk,
			gameType,
			play,
			teams,
			homePlayers,
			awayPlayers,
			homeGoalieId,
			awayGoalieId,
		};
		if (play.about.periodType !== PeriodType.Shootout) {
			switch (play.result.eventTypeId) {
				case EventTypeId.Goal: {
					const goalEvent: Event = getEvent(EventType.Goal, play.players[0].player.id, metaInfo);
					events.push(goalEvent);
					const playerIds: number[] = [goalEvent.playerId];
					for (let i: number = 1; i < play.players.length; i++) {
						const player: Player = play.players[i];
						playerIds.push(player.player.id);
						if (player.playerType === PlayerType.Goalie) {
							events.push(getEvent(EventType.GoalAllowed, player.player.id, metaInfo));
						} else {
							events.push(getEvent(EventType.Assist, player.player.id, metaInfo));
						}
					}
					for (const homePlayerId of homePlayers) {
						if (!playerIds.includes(homePlayerId))
							events.push(getEvent(goalEvent.isHome ? EventType.OnIceGoal : EventType.OnIceGoalAllowed, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (!playerIds.includes(awayPlayerId))
							events.push(getEvent(goalEvent.isHome ? EventType.OnIceGoalAllowed : EventType.OnIceGoal, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.Shot: {
					const shotEvent: Event = getEvent(EventType.Shot, play.players[0].player.id, metaInfo);
					const saveEvent: Event = getEvent(EventType.Save, play.players[1].player.id, metaInfo);
					events.push(shotEvent);
					events.push(saveEvent);
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== shotEvent.playerId && homePlayerId !== saveEvent.playerId)
							events.push(getEvent(shotEvent.isHome ? EventType.OnIceShot : EventType.OnIceSave, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== shotEvent.playerId && awayPlayerId !== saveEvent.playerId)
							events.push(getEvent(shotEvent.isHome ? EventType.OnIceSave : EventType.OnIceShot, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.BlockedShot: {
					const blockedShotEvent: Event = getEvent(EventType.BlockedShot, play.players[0].player.id, metaInfo);
					const shotBlockedEvent: Event = getEvent(EventType.ShotBlocked, play.players[1].player.id, metaInfo);
					events.push(blockedShotEvent);
					events.push(shotBlockedEvent);
					if (blockedShotEvent.isHome && homeGoalieId) events.push(getEvent(EventType.OnIceBlockedShot, homeGoalieId, metaInfo));
					if (!blockedShotEvent.isHome && awayGoalieId) events.push(getEvent(EventType.OnIceShotBlocked, awayGoalieId, metaInfo));
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== blockedShotEvent.playerId && homePlayerId !== shotBlockedEvent.playerId)
							events.push(getEvent(blockedShotEvent.isHome ? EventType.OnIceBlockedShot : EventType.OnIceShotBlocked, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== blockedShotEvent.playerId && awayPlayerId !== shotBlockedEvent.playerId)
							events.push(getEvent(blockedShotEvent.isHome ? EventType.OnIceShotBlocked : EventType.OnIceBlockedShot, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.MissedShot: {
					const shotMissEvent: Event = getEvent(EventType.ShotMissed, play.players[0].player.id, metaInfo);
					events.push(shotMissEvent);
					if (shotMissEvent.isHome && awayGoalieId) events.push(getEvent(EventType.OnIceMissedShot, awayGoalieId, metaInfo));
					if (!shotMissEvent.isHome && homeGoalieId) events.push(getEvent(EventType.OnIceMissedShot, homeGoalieId, metaInfo));
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== shotMissEvent.playerId)
							events.push(getEvent(shotMissEvent.isHome ? EventType.OnIceShotMissed : EventType.OnIceMissedShot, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== shotMissEvent.playerId)
							events.push(getEvent(shotMissEvent.isHome ? EventType.OnIceMissedShot : EventType.OnIceShotMissed, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.Faceoff: {
					const faceOffWinEvent: Event = getEvent(EventType.FaceoffWin, play.players[0].player.id, metaInfo);
					const faceOffLoseEvent: Event = getEvent(EventType.FaceoffLoss, play.players[1].player.id, metaInfo);
					events.push(faceOffWinEvent);
					events.push(faceOffLoseEvent);
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== faceOffWinEvent.playerId && homePlayerId !== faceOffLoseEvent.playerId)
							events.push(getEvent(faceOffWinEvent.isHome ? EventType.OnIceFaceoffWin : EventType.OnIceFaceoffLoss, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== faceOffWinEvent.playerId && awayPlayerId !== faceOffLoseEvent.playerId)
							events.push(getEvent(faceOffWinEvent.isHome ? EventType.OnIceFaceoffLoss : EventType.OnIceFaceoffWin, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.Takeaway: {
					const takeAwayEvent: Event = getEvent(EventType.Takeaway, play.players[0].player.id, metaInfo);
					events.push(takeAwayEvent);
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== takeAwayEvent.playerId)
							events.push(getEvent(takeAwayEvent.isHome ? EventType.OnIceTakeaway : EventType.OnIceGiveaway, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== takeAwayEvent.playerId)
							events.push(getEvent(takeAwayEvent.isHome ? EventType.OnIceGiveaway : EventType.OnIceTakeaway, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.Giveaway: {
					const giveAwayEvent: Event = getEvent(EventType.Giveaway, play.players[0].player.id, metaInfo);
					events.push(giveAwayEvent);
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== giveAwayEvent.playerId)
							events.push(getEvent(giveAwayEvent.isHome ? EventType.OnIceGiveaway : EventType.OnIceTakeaway, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== giveAwayEvent.playerId)
							events.push(getEvent(giveAwayEvent.isHome ? EventType.OnIceTakeaway : EventType.OnIceGiveaway, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.Hit: {
					const hitEvent: Event = getEvent(EventType.Hit, play.players[0].player.id, metaInfo);
					const hitAgainstEvent: Event = getEvent(EventType.HitAgainst, play.players[1].player.id, metaInfo);
					events.push(hitEvent);
					events.push(hitAgainstEvent);
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== hitEvent.playerId && homePlayerId !== hitAgainstEvent.playerId)
							events.push(getEvent(hitEvent.isHome ? EventType.OnIceHit : EventType.OnIceHitAgainst, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== hitEvent.playerId && awayPlayerId !== hitAgainstEvent.playerId)
							events.push(getEvent(hitEvent.isHome ? EventType.OnIceHitAgainst : EventType.OnIceHit, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.Penalty: {
					const penaltyAgainstEvent: Event = getEvent(EventType.PenaltyAgainst, play.players[0].player.id, metaInfo);
					events.push(penaltyAgainstEvent);
					let penaltyForEvent: Event | undefined;
					if (play.players.length > 1) {
						penaltyForEvent = getEvent(EventType.PenaltyFor, play.players[1].player.id, metaInfo);
					}
					for (const homePlayerId of homePlayers) {
						if (homePlayerId !== penaltyAgainstEvent.playerId && (!penaltyForEvent || penaltyForEvent.playerId !== homePlayerId))
							events.push(getEvent(penaltyAgainstEvent.isHome ? EventType.OnIcePenaltyAgainst : EventType.OnIcePenaltyFor, homePlayerId, metaInfo));
					}
					for (const awayPlayerId of awayPlayers) {
						if (awayPlayerId !== penaltyAgainstEvent.playerId && (!penaltyForEvent || penaltyForEvent.playerId !== awayPlayerId))
							events.push(getEvent(penaltyAgainstEvent.isHome ? EventType.OnIcePenaltyFor : EventType.OnIcePenaltyAgainst, awayPlayerId, metaInfo));
					}
					break;
				}
				case EventTypeId.Stop: {
					const players: number[] = [...homePlayers, ...awayPlayers];
					if (play.result.description === Description.Icing) {
						for (const playerId of players) {
							events.push(getEvent(EventType.OnIceIcing, playerId, metaInfo));
						}
					} else if (play.result.description === Description.Offside) {
						for (const playerId of players) {
							events.push(getEvent(EventType.OnIceOffside, playerId, metaInfo));
						}
					} else if (play.result.description.includes(Description.Puck)) {
						for (const playerId of players) {
							events.push(getEvent(EventType.OnIcePuckOutOfPlay, playerId, metaInfo));
						}
					}
					break;
				}
				default:
					break;
			}
		} else {
			switch (play.result.eventTypeId) {
				case EventTypeId.Goal: {
					events.push(getEvent(EventType.ShootOutGoal, play.players[0].player.id, metaInfo));
					events.push(getEvent(EventType.ShootOutGoalAllowed, play.players[1].player.id, metaInfo));
					break;
				}
				case EventTypeId.Shot: {
					events.push(getEvent(EventType.ShootOutShot, play.players[0].player.id, metaInfo));
					events.push(getEvent(EventType.ShootOutSave, play.players[1].player.id, metaInfo));
					break;
				}
				case EventTypeId.MissedShot: {
					const shotMissEvent: Event = getEvent(EventType.ShootOutMiss, play.players[0].player.id, metaInfo);
					events.push(shotMissEvent);
					if (shotMissEvent.isHome && awayGoalieId) events.push(getEvent(EventType.ShootOutOnIceMiss, awayGoalieId, metaInfo));
					if (!shotMissEvent.isHome && homeGoalieId) events.push(getEvent(EventType.ShootOutOnIceMiss, homeGoalieId, metaInfo));
					break;
				}
				default:
					break;
			}
		}
	}
	return events;
}
