import { EntityRepository, Repository, SelectQueryBuilder, Between } from 'typeorm';

import { Shift } from '../entities/Shift';
import { FilterConditions } from '../controllers/StatsController';

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
	getShiftFilterQuery(filterConditions: FilterConditions): SelectQueryBuilder<Shift> {
		const {
			startDate,
			endDate,
			startTime,
			endTime,
			gameType,
			strength,
			playerIds,
		}: {
			startDate: string;
			endDate: string;
			startTime: number;
			endTime: number;
			gameType: string;
			strength: Array<Array<string>>;
			playerIds?: number[];
		} = filterConditions;

		let query: SelectQueryBuilder<Shift> = this.createQueryBuilder('shift').where({
			timestamp: Between(startDate, endDate),
			startTime: Between(startTime, endTime),
			endTime: Between(startTime, endTime),
		});

		if (gameType) {
			query = query.andWhere('shift."gameType" = :gameType', { gameType });
		}

		if (strength) {
			for (const item of strength) {
				const queryString: string = `shift."${item[0]}" ${item[1]} ${isNaN(parseInt(item[2])) ? `shift."${item[2]}"` : item[2]}`;
				query = query.andWhere(queryString);
			}
		}

		if (playerIds) {
			query = query.andWhere('shift."playerId" IN (:...playerIds)', { playerIds });
		}

		return query;
	}

	async getTimeOnIce(filterConditions: FilterConditions): Promise<Map<number, ShiftCounts>> {
		let query: SelectQueryBuilder<Shift> = this.getShiftFilterQuery(filterConditions);

		query = query.select(['shift."playerId"', 'count(distinct(shift."gamePk"))', 'sum(shift.length)']).groupBy('shift."playerId"');

		const results: any[] = await query.getRawMany();

		const playerTimeMap: Map<number, ShiftCounts> = new Map<number, ShiftCounts>();

		for (const result of results) {
			playerTimeMap.set(result.playerId, new ShiftCounts({ timeOnIce: parseInt(result.sum), gamesPlayed: parseInt(result.count) }));
		}

		return playerTimeMap;
	}
}
