import { EntityRepository, Repository } from 'typeorm';

import { Shift } from '../entities/Shift';
import { FilterConditions } from '../middleware/ValidateMiddleware';

export class ShiftCounts {
	timeOnIce: number;
	gamesPlayed: number;

	constructor({ timeOnIce, gamesPlayed }: { timeOnIce: number; gamesPlayed: number }) {
		this.timeOnIce = timeOnIce;
		this.gamesPlayed = gamesPlayed;
	}
}

@EntityRepository(Shift)
export default class ShiftRepository extends Repository<Shift> {
	getFilterSql(filterConditions: FilterConditions): string {
		let sql: string = `
			WHERE timestamp >= '${filterConditions.startDate}'
			AND timestamp <= '${filterConditions.endDate}'
			AND "startTime" >= ${filterConditions.startTime}
			AND "startTime" <= ${filterConditions.endTime}
			AND "endTime" >= ${filterConditions.startTime}
			AND "endTime" <= ${filterConditions.endTime}
		`;

		if (filterConditions.gameType) sql = sql + `\n AND "gameType" = '${filterConditions.gameType}'`;

		if (filterConditions.strength) {
			for (const item of filterConditions.strength) {
				sql = sql + `\n AND "${item[0]}" ${item[1]} ${isNaN(parseInt(item[2])) ? `"${item[2]}"` : item[2]}`;
			}
		}
		return sql;
	}

	async getTimeOnIce(filterConditions: FilterConditions, playerIds: number[]): Promise<Map<number, ShiftCounts>> {
		const sql: string = `
			SELECT "playerId", count(distinct("gamePk")), sum(length)
			FROM shifts
			${this.getFilterSql(filterConditions)}
			AND "playerId" IN(${playerIds.join(`,`)})
			GROUP BY "playerId"
		`;

		const results: any[] = await this.query(sql);

		const playerTimeMap: Map<number, ShiftCounts> = new Map<number, ShiftCounts>();

		for (const result of results) {
			playerTimeMap.set(result.playerId, new ShiftCounts({ timeOnIce: parseInt(result.sum), gamesPlayed: parseInt(result.count) }));
		}

		return playerTimeMap;
	}
}
