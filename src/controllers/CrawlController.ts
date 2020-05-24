/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { route, POST, before } from 'awilix-koa';
import { OK } from 'http-status-codes';
import { Context } from 'koa';
import { assert, object, string } from '@hapi/joi';
import { Connection, In } from 'typeorm';
import request, { AxiosPromise } from 'axios';

import Logger from '../Logger';
import EventRepository from '../repositories/EventRepository';
import TeamRepository from '../repositories/TeamRepository';
import PlayerRepository from '../repositories/PlayerRepository';
import { Event } from '../entities/Event';
import { Team } from '../entities/Team';
import { Player } from '../entities/Player';

import { GameType } from '../lib/Constants';
import { getEvents } from '../lib/Utils';
import GameEvents from '../lib/interfaces/GameEvent';
import GameShifts from '../lib/interfaces/GameShifts';
import GameSummaries from '../lib/interfaces/GameSummaries';
import TeamProfile, { TeamData, Roster2 } from '../lib/interfaces/TeamProfile';
import PlayerProfile, { Person } from '../lib/interfaces/PlayerProfile';
import AdminAuthentication from '../middleware/AdminAuthentication';

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

	@route('/profiles')
	@POST()
	async profiles(ctx: Context) {
		assert(
			ctx.request.body,
			object({
				year: string().length(8).alphanum().required(),
			}),
		);

		this.crawlProfiles(ctx.request.body.year);

		ctx.body = {};
		ctx.status = OK;
	}

	async crawlProfiles(year: string) {
		Logger.info(`Beginning crawl for year: ${year}`);

		const teamProfiles: TeamProfile = await request(`http://statsapi.web.nhl.com/api/v1/teams?expand=team.roster&season=${year}`);
		for (let i: number = 0; i < teamProfiles.data.teams.length; i += 1) {
			const teamData: TeamData = teamProfiles.data.teams[i];
			const team: Team = new Team();
			Object.assign(team, {
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
			await this._teamRepository.save(team);

			const roster: Roster2[] = teamData.roster.roster;
			const requests: AxiosPromise<any>[] = [];
			for (let j: number = 0; j < roster.length; j += 1) {
				const playerId: number = roster[j].person.id;
				requests.push(request(`https://statsapi.web.nhl.com/api/v1/people/${playerId}?expand=person`));
			}

			const responses: PlayerProfile[] = ((await Promise.all(requests)) as unknown) as PlayerProfile[];

			for (let k: number = 0; k < responses.length; k += 1) {
				const playerData: Person = responses[k].data.people[0];
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

				await this._playerRepository.save(player);
			}
		}

		Logger.info(`Finished crawl for year: ${year}`);
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

				for (const game of games) {
					const gamePk: number = game.gamePk;
					Logger.info(`Beginning game ${gamePk}`);

					const gameEvents: GameEvents = await request(`https://statsapi.web.nhl.com/api/v1/game/${gamePk}/feed/live`);
					const gameShifts: GameShifts = await request(`https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${gamePk}`);
					const gameSummaries: GameSummaries = await request(
						`https://api.nhle.com/stats/rest/en/team/summary?reportType=basic&isGame=true&reportName=teamsummary&cayenneExp=gameId=${gamePk}`,
					);

					// Validate data
					if ([2018020226, 2017021080, 2017021126, 2017021143].includes(gamePk)) {
						console.warn('***Bad game found, skipping***');
						continue;
					}

					if (gameEvents.data.gameData.status.abstractGameState !== 'Final') {
						throw new Error('Game state not final yet');
					}

					if (!gameShifts.data.data.length) {
						throw new Error('Game shifts not found');
					}

					if (!gameSummaries.data.data.length) {
						throw new Error('Game summaries not found');
					}

					if (!gameEvents.data.liveData.plays.allPlays.length) {
						throw new Error('Game events not found');
					}

					await this.crawlPlayers(gameEvents);

					const events: Event[] = getEvents(gamePk, gameEvents, gameShifts);

					if (events.length) {
						await this._eventRepository.save(events, { chunk: 1000 });
						const count: number = await this._eventRepository.count();
						console.log(count);
					}
				}
			}
		} catch (ex) {
			console.log(ex);
		}
	}

	async crawlPlayers(gameEvents: GameEvents) {
		const playerIds: number[] = [
			...gameEvents.data.liveData.boxscore.teams.away.skaters,
			...gameEvents.data.liveData.boxscore.teams.away.goalies,
			...gameEvents.data.liveData.boxscore.teams.home.skaters,
			...gameEvents.data.liveData.boxscore.teams.home.goalies,
		];
		const existingPlayerIds: any[] = await this._playerRepository
			.createQueryBuilder('players')
			.select(['players.id'])
			.where({ id: In(playerIds) })
			.getRawMany();

		const existingPlayersSet: Set<number> = new Set<number>();
		for (const existingPlayerId of existingPlayerIds) {
			existingPlayersSet.add(existingPlayerId.players_id);
		}

		const missingPlayerIds: number[] = playerIds.filter((pId: number) => !existingPlayersSet.has(pId));

		if (missingPlayerIds.length) Logger.info(`Found missing players: ${missingPlayerIds}`);

		for (const playerId of missingPlayerIds) {
			Logger.info(`Syncing missing player: ${playerId}`);

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

			await this._playerRepository.save(player);
		}
	}
}
