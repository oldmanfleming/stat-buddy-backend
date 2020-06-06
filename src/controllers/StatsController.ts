import { route, POST, before } from 'awilix-koa';
import { OK, NOT_FOUND } from 'http-status-codes';
import { Context } from 'koa';
import { assert, string } from '@hapi/joi';
import { Connection } from 'typeorm';

import { FilterConditions, ValidateFilter, QueryConditions, VaildateQuery } from '../middleware/ValidateMiddleware';
import EventRepository, { EventCounts, ZoneStarts } from '../repositories/EventRepository';
import ShiftRepository, { ShiftCounts } from '../repositories/ShiftRepository';
import { PlayerStats } from '../daos/PlayerStats';

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
@before([ValidateFilter, VaildateQuery])
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

		const filterConditions: FilterConditions = new FilterConditions({ ...ctx.request.body });

		const playersStats: PlayerStats[] = await this.getPlayersInternal(filterConditions, [playerId]);

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
		const queryConditions: QueryConditions = new QueryConditions(ctx.query);
		const filterConditions: FilterConditions = new FilterConditions({ ...ctx.request.body });

		const playerIds: number[] = await this.eventRepository.getTopIds(filterConditions, queryConditions);

		if (playerIds.length) {
			ctx.body = await this.getPlayersInternal(filterConditions, playerIds);
		}
		ctx.status = OK;
	}

	async getPlayersInternal(filterConditions: FilterConditions, playerIds: number[]): Promise<PlayerStats[]> {
		const playersStats: PlayerStats[] = [];

		const [playersEventCounts, playersShiftCounts, playersZoneStarts] = await Promise.all([
			this.eventRepository.getEventCounts(filterConditions, playerIds),
			this.shiftRepository.getTimeOnIce(filterConditions, playerIds),
			this.eventRepository.getZoneStarts(filterConditions, playerIds),
		]);

		for (const playerId of playerIds) {
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
