import { Context, Next } from 'koa';
import { assert, string, object, number, array } from '@hapi/joi';

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

export enum Sort {
	Goals = 'G',
	Assists = 'A',
	Points = 'P',
	CorsiForPercentage = 'CFP',
	FenwickForPercentage = 'FFP',
	AverageTimeOnIce = 'ATOI',
	PDO = 'PDO',
	OffensiveZoneStartsPercentage = 'OZSP',
}

export enum Order {
	Ascending = 'ASC',
	Descending = 'DESC',
}

export class QueryConditions {
	sort: Sort;
	order: Order;
	offset: number;
	limit: number;

	constructor({
		sort = Sort.CorsiForPercentage,
		order = Order.Descending,
		offset = 0,
		limit = 10,
	}: {
		sort?: Sort;
		order?: Order;
		offset?: number;
		limit?: number;
	}) {
		this.sort = sort;
		this.order = order;
		this.offset = offset;
		this.limit = limit;
	}
}

export async function VaildateQuery(ctx: Context, next: Next): Promise<any> {
	assert(
		ctx.query,
		object({
			sort: string().valid(...Object.values(Sort)),
			order: string().valid(...Object.values(Order)),
			offset: number().min(0).max(10),
			limit: number().min(0).max(10),
		}),
	);

	return next();
}

export async function ValidateFilter(ctx: Context, next: Next): Promise<any> {
	assert(
		ctx.request.body,
		object({
			startDate: string().isoDate().required(),
			endDate: string().isoDate().required(),
			startTime: number().min(0).max(7200).required(),
			endTime: number().min(0).max(7200).required(),
			gameType: string().valid(...['R', 'P']),
			strength: array().items(array().length(3).items(string())),
		}),
	);

	if (ctx.request.body.strength) {
		for (const item of ctx.request.body.strength) {
			assert(item[0], string().valid(...['teamStrength', 'opposingStrength']));
			assert(item[1], string().valid(...['>', '<', '=', '>=', '<=']));
			assert(item[2], string().valid(...['teamStrength', 'opposingStrength', '3', '4', '5', '6']));
		}
	}

	return next();
}
