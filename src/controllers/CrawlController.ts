import { route, POST, before } from 'awilix-koa';
import { OK } from 'http-status-codes';
import { Context } from 'koa';
import { assert, object, string } from '@hapi/joi';
import { Connection, In } from 'typeorm';
import request from 'axios';

import Logger from '../Logger';
import EventRepository from '../repositories/EventRepository';
import TeamRepository from '../repositories/TeamRepository';
import PlayerRepository from '../repositories/PlayerRepository';
import { Event } from '../entities/Event';
import { Team } from '../entities/Team';
import { Player } from '../entities/Player';

import { GameType } from '../lib/Constants';
import { getEvents } from '../lib/EventParser';
import { constructEvents } from '../lib/EventConstructor';
import GameEvents from '../lib/interfaces/GameEvent';
import GameShifts from '../lib/interfaces/GameShifts';
import GameSummaries from '../lib/interfaces/GameSummaries';
import TeamProfile, { TeamData } from '../lib/interfaces/TeamProfile';
import PlayerProfile, { Person } from '../lib/interfaces/PlayerProfile';
import AdminAuthentication from '../middleware/AdminAuthentication';
import PlayerList, { PlayerItem } from '../lib/interfaces/PlayerList';

@route('/api/crawl')
@before([AdminAuthentication])
export default class CrawlController {
	private _eventRepository: EventRepository;
	private _playerRepository: PlayerRepository;
	private _teamRepository: TeamRepository;

	// Any Dependencies registered to the container can be injected here
	constructor({ connection }: { connection: Connection }) {
		this._eventRepository = connection.getCustomRepository(EventRepository);
		this._playerRepository = connection.getCustomRepository(PlayerRepository);
		this._teamRepository = connection.getCustomRepository(TeamRepository);
	}

	@route('/teams')
	@POST()
	async teams(ctx: Context) {
		const teams: Team[] = [];
		const teamProfiles: TeamProfile = await request(`http://statsapi.web.nhl.com/api/v1/teams`);
		for (let i: number = 0; i < teamProfiles.data.teams.length; i += 1) {
			const teamData: TeamData = teamProfiles.data.teams[i];
			const team: Team = Object.assign(new Team(), {
				id: teamData.id,
				name: teamData.name,
				venue: teamData.venue.name,
				city: teamData.venue.city,
				abbreviation: teamData.abbreviation,
				teamName: teamData.teamName,
				locationName: teamData.locationName,
				division: teamData.division.name,
				divisionId: teamData.division.id,
				conference: teamData.conference.name,
				conferenceId: teamData.conference.id,
			});
			teams.push(team);
		}
		await this._teamRepository.save(teams);

		ctx.body = {};
		ctx.status = OK;
	}

	@route('/players')
	@POST()
	async players(ctx: Context) {
		assert(
			ctx.request.body,
			object({
				startYear: string().length(8).alphanum().required(),
				endYear: string().length(8).alphanum().required(),
			}),
		);

		const playerList: PlayerList = await request(
			`https://api.nhle.com/stats/rest/en/skater/summary?cayenneExp=seasonId>=${ctx.request.body.startYear}%20and%20seasonId<=${ctx.request.body.endYear}`,
		);

		const playerIds: number[] = playerList.data.data.map((playerItem: PlayerItem) => playerItem.playerId);
		const existingPlayerIds: any[] = await this._playerRepository
			.createQueryBuilder('players')
			.select(['players.id'])
			.where({ id: In(playerIds) })
			.getRawMany();

		const existingPlayersSet: Set<number> = new Set<number>();
		for (const existingPlayerId of existingPlayerIds) {
			existingPlayersSet.add(existingPlayerId.players_id);
		}

		const newPlayerIds: number[] = playerIds.filter((pId: number) => !existingPlayersSet.has(pId));

		const players: Player[] = [];
		for (let i: number = 0; i < newPlayerIds.length; i += 1) {
			const playerId: number = newPlayerIds[i];
			const playerProfile: PlayerProfile = await request(`https://statsapi.web.nhl.com/api/v1/people/${playerId}?expand=person`);
			const playerData: Person = playerProfile.data.people[0];
			const player: Player = Object.assign(new Player(), {
				id: playerData.id,
				fullName: playerData.fullName,
				firstName: playerData.firstName,
				lastName: playerData.lastName,
				primaryNumber: playerData.primaryNumber,
				birthDate: playerData.birthDate,
				currentAge: playerData.currentAge,
				birthCity: playerData.birthCity,
				birthCountry: playerData.birthCountry,
				nationality: playerData.nationality,
				height: playerData.height,
				weight: playerData.weight,
				active: playerData.active,
				alternateCaptain: playerData.alternateCaptain,
				captain: playerData.captain,
				rookie: playerData.rookie,
				shootsCatches: playerData.shootsCatches,
				rosterStatus: playerData.rosterStatus,
				primaryPosition: playerData.primaryPosition.type,
				currantAge: playerData.currentAge,
				currentTeamId: playerData.currentTeam && playerData.currentTeam.id,
			});
			players.push(player);
		}

		await this._playerRepository.save(players, { chunk: 1000 });

		ctx.body = {};
		ctx.status = OK;
	}

	@route('/games')
	@POST()
	async games(ctx: Context) {
		assert(
			ctx.request.body,
			object({
				startDate: string().required(),
				endDate: string().required(),
			}),
		);

		// if you use 00 hours, daylight savings will fuck you and skip/redo a day
		const startDate: Date = new Date(`${ctx.request.body.startDate}T12:00:00.000Z`);
		const endDate: Date = new Date(`${ctx.request.body.endDate}T12:00:00.000Z`);

		this.crawlGames(startDate, endDate);

		ctx.body = {};
		ctx.status = OK;
	}

	async crawlGames(startDate: Date, endDate: Date) {
		try {
			for (const date: Date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
				Logger.info(`beginning date ${date.toISOString().split('T')[0]}`);

				const schedule: any = await request(`https://statsapi.web.nhl.com/api/v1/schedule?date=${date.toISOString().split('T')[0]}`);

				if (!schedule.data.dates.length) {
					Logger.info(`no games found for ${date.toISOString()}`);
					continue;
				}

				const games: any = schedule.data.dates[0].games.filter(
					(game: any) => game.gameType !== GameType.AllStarGameType && game.gameType !== GameType.PreSeasonGameType,
				);

				for (let i: number = 5; i < 6; i++) {
					const gamePk: number = games[i].gamePk;
					Logger.info(`Beginning game ${gamePk}`);

					const gameEvents: GameEvents = await request(`https://statsapi.web.nhl.com/api/v1/game/${gamePk}/feed/live`);
					const gameShifts: GameShifts = await request(`https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${gamePk}`);
					const gameSummaries: GameSummaries = await request(
						`https://api.nhle.com/stats/rest/en/team/summary?reportType=basic&isGame=true&reportName=teamsummary&cayenneExp=gameId=${gamePk}`,
					);

					if (gameEvents.data.gameData.status.abstractGameState !== 'Final') {
						throw new Error('Game state not final yet');
					}

					if (!gameShifts.data.data.length) {
						throw new Error('Game shifts not found');
					}

					if (!gameSummaries.data.data.length) {
						throw new Error('Game summaries not found');
					}

					const events: Event[] = gameEvents.data.liveData.plays.allPlays.length ? getEvents(gamePk, gameEvents, gameShifts) : constructEvents(gameEvents);

					if (events.length) {
						await this._eventRepository.save(events, { chunk: 1000 });
						const count: number = await this._eventRepository.count();
						console.log(count);
					}
				}
			}
		} catch (ex) {
			console.error(ex);
		}
	}
}
