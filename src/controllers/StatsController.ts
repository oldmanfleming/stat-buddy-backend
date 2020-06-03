import { route, POST, before } from 'awilix-koa';
import { OK, NOT_FOUND } from 'http-status-codes';
import { Context } from 'koa';
import { assert, string } from '@hapi/joi';
import { Connection } from 'typeorm';

import ValidateFilter from '../middleware/ValidateFilter';
import EventRepository, { EventCounts, ZoneStarts } from '../repositories/EventRepository';
import ShiftRepository, { ShiftCounts } from '../repositories/ShiftRepository';
import { PlayerStats } from '../daos/PlayerStats';

export class FilterConditions {
	startDate: string;
	endDate: string;
	startTime: number;
	endTime: number;
	gameType: string;
	strength: Array<Array<string>>;
	playerIds?: number[];
	teamIds?: number[];

	constructor({
		startDate,
		endDate,
		startTime,
		endTime,
		gameType,
		strength,
		playerIds,
		teamIds,
	}: {
		startDate: string;
		endDate: string;
		startTime: number;
		endTime: number;
		gameType: string;
		strength: Array<Array<string>>;
		playerIds?: number[];
		teamIds?: number[];
	}) {
		this.startDate = startDate;
		this.endDate = endDate;
		this.startTime = startTime;
		this.endTime = endTime;
		this.gameType = gameType;
		this.strength = strength;
		this.playerIds = playerIds;
		this.teamIds = teamIds;
	}
}

export interface PlayersData {
	eventCounts: Map<number, EventCounts>;
	shiftCounts: Map<number, ShiftCounts>;
	zoneStarts: Map<number, ZoneStarts>;
}
/*
 * TODO:
 * look into zone starts
 * CF/FF relative?
 * per 60?
 */
@route('/v1/stats')
@before([ValidateFilter])
export default class StatsController {
	private eventRepository: EventRepository;
	private shiftRepository: ShiftRepository;

	constructor({ connection }: { connection: Connection }) {
		this.eventRepository = connection.getCustomRepository(EventRepository);
		this.shiftRepository = connection.getCustomRepository(ShiftRepository);
	}

	@route('/player/:id')
	@POST()
	async getPlayerById(ctx: Context) {
		assert(ctx.params.id, string().regex(/^\d+$/));
		const playerId: number = parseInt(ctx.params.id);

		const filterConditions: FilterConditions = new FilterConditions({ ...ctx.request.body, playerIds: [playerId] });

		const playersStats: PlayerStats[] = await this.getPlayersInternal(filterConditions);

		if (!playersStats.length) {
			ctx.body = undefined;
			ctx.status = NOT_FOUND;
			return;
		}

		ctx.body = playersStats[0];
		ctx.status = OK;
	}

	@route('/player')
	@POST()
	async getPlayers(ctx: Context) {
		const playerIds: number[] = [8471228, 8473994, 8478046, 8474849];

		const filterConditions: FilterConditions = new FilterConditions({ ...ctx.request.body, playerIds });

		const playersStats: PlayerStats[] = await this.getPlayersInternal(filterConditions);

		ctx.body = playersStats;
		ctx.status = OK;
	}

	async getPlayersInternal(filterConditions: FilterConditions): Promise<PlayerStats[]> {
		const playersStats: PlayerStats[] = [];

		if (!filterConditions.playerIds) {
			return playersStats;
		}

		const [playersEventCounts, playersShiftCounts, playersZoneStarts] = await Promise.all([
			this.eventRepository.getEventCounts(filterConditions),
			this.shiftRepository.getTimeOnIce(filterConditions),
			this.eventRepository.getZoneStarts(filterConditions),
		]);

		for (const playerId of filterConditions.playerIds) {
			const eventCounts: EventCounts | undefined = playersEventCounts.get(playerId);
			const shiftCounts: ShiftCounts | undefined = playersShiftCounts.get(playerId);
			const zoneStarts: ZoneStarts | undefined = playersZoneStarts.get(playerId);

			if (eventCounts && shiftCounts && zoneStarts) {
				playersStats.push(new PlayerStats(eventCounts, shiftCounts, zoneStarts));
			}
		}

		return playersStats;
	}
}
