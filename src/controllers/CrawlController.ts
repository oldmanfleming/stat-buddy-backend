/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { route, POST } from 'awilix-koa';
import { OK } from 'http-status-codes';
import { Context } from 'koa';
import { assert, object, string } from '@hapi/joi';
import { Connection } from 'typeorm';
import request, { AxiosPromise } from 'axios';

import Logger from '../Logger';
import { GameType } from '../lib/Constants';
import { getEvents } from '../lib/Utils';

import EventRepository from '../repositories/EventRepository';
import TeamRepository from '../repositories/TeamRepository';
import PlayerRepository from '../repositories/PlayerRepository';

import { Event } from '../entities/Event';
import { Team } from '../entities/Team';
import { Player } from '../entities/Player';

import GameEvents from '../interfaces/GameEvent';
import GameShifts from '../interfaces/GameShifts';
import GameSummaries from '../interfaces/GameSummaries';
import TeamProfile, { TeamData, Roster2 } from '../interfaces/TeamProfile';
import PlayerProfile, { Person } from '../interfaces/PlayerProfile';

@route('/api/crawl')
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

	// TODO: Make admin only
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
				startDate: string().isoDate().required(),
				endDate: string().isoDate().required(),
			}),
		);

		const startDate: Date = new Date(ctx.request.body.startDate);
		const endDate: Date = new Date(ctx.request.body.endDate);

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
					return;
				}

				const games: any = schedule.data.dates[0].games.filter(
					(game: any) => game.gameType !== GameType.AllStarGameType && game.gameType !== GameType.PreSeasonGameType,
				);

				for (let i: number = 0; i < 1; i++) {
					const gamePk: number = games[i].gamePk;
					Logger.info(`Beginning game ${gamePk}`);

					const gameEvents: GameEvents = await request(`https://statsapi.web.nhl.com/api/v1/game/${gamePk}/feed/live`);
					const gameShifts: GameShifts = await request(`https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${gamePk}`);
					const gameSummaries: GameSummaries = await request(
						`https://api.nhle.com/stats/rest/en/team/summary?reportType=basic&isGame=true&reportName=teamsummary&cayenneExp=gameId=${gamePk}`,
					);

					// Validate data
					if (gameEvents.data.gameData.status.abstractGameState !== 'Final') {
						throw new Error('Game state not final yet');
					}

					if (gameShifts.data.data.length <= 0) {
						throw new Error('Game shifts not found');
					}

					if (gameSummaries.data.data.length <= 0) {
						throw new Error('Game summaries not found');
					}

					if (!gameEvents.data.liveData.plays.allPlays.length) {
						console.log(gamePk);
						throw new Error('Bad game found');
					}

					const events: Event[] = getEvents(gamePk, gameEvents, gameShifts);

					// for (let i: number = 0; i < 12; i++) {
					// 	console.log(events[i]);
					// }
					// console.log(events.length);

					if (events.length) {
						await this._eventRepository.save(events);
						const count: number = await this._eventRepository.count();
						console.log(count);
					}
				}
			}
		} catch (ex) {
			console.log(ex);
		}
	}
}
