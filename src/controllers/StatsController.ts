import { route, POST, before } from 'awilix-koa';
import { OK, NOT_FOUND } from 'http-status-codes';
import { Context } from 'koa';
import { assert, string } from '@hapi/joi';
import { Connection } from 'typeorm';

import ValidateFilter from '../middleware/ValidateFilter';
import EventRepository, { EventCounts } from '../repositories/EventRepository';
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
	async getPlayer(ctx: Context) {
		assert(ctx.params.id, string().regex(/^\d+$/));
		const playerId: number = parseInt(ctx.params.id);

		const filterConditions: FilterConditions = new FilterConditions({ ...ctx.request.body, playerIds: [playerId] });

		const playerEventCounts: Map<number, EventCounts> = await this.eventRepository.getEventCounts(filterConditions);
		const playerShiftCounts: Map<number, ShiftCounts> = await this.shiftRepository.getTimeOnIce(filterConditions);

		const eventCounts: EventCounts | undefined = playerEventCounts.get(playerId);
		const shiftCounts: ShiftCounts | undefined = playerShiftCounts.get(playerId);

		if (!eventCounts || !shiftCounts) {
			ctx.body = undefined;
			ctx.status = NOT_FOUND;
			return;
		}

		const playerStats: PlayerStats = new PlayerStats(eventCounts, shiftCounts);

		// TODO:
		// CF/FF relative?
		// per 60?
		// zone starts
		// penalty minutes

		ctx.body = playerStats;
		ctx.status = OK;
	}
}
