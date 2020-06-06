/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EntityRepository, Repository } from 'typeorm';

import { Event, EventType, Zone } from '../entities/Event';
import { FilterConditions, QueryConditions, Sort } from '../middleware/ValidateMiddleware';

export class EventCounts {
	[EventType.Assist]: number = 0;
	[EventType.BlockedShot]: number = 0;
	[EventType.FaceoffLoss]: number = 0;
	[EventType.FaceoffWin]: number = 0;
	[EventType.Giveaway]: number = 0;
	[EventType.Goal]: number = 0;
	[EventType.GoalAllowed]: number = 0;
	[EventType.Hit]: number = 0;
	[EventType.HitAgainst]: number = 0;
	[EventType.OnIceBlockedShot]: number = 0;
	[EventType.OnIceFaceoffLoss]: number = 0;
	[EventType.OnIceFaceoffWin]: number = 0;
	[EventType.OnIceGiveaway]: number = 0;
	[EventType.OnIceGoal]: number = 0;
	[EventType.OnIceGoalAllowed]: number = 0;
	[EventType.OnIceHit]: number = 0;
	[EventType.OnIceHitAgainst]: number = 0;
	[EventType.OnIceIcing]: number = 0;
	[EventType.OnIceMissedShot]: number = 0;
	[EventType.OnIceOffside]: number = 0;
	[EventType.OnIcePenaltyAgainst]: number = 0;
	[EventType.OnIcePenaltyFor]: number = 0;
	[EventType.OnIcePuckOutOfPlay]: number = 0;
	[EventType.OnIceSave]: number = 0;
	[EventType.OnIceShot]: number = 0;
	[EventType.OnIceShotBlocked]: number = 0;
	[EventType.OnIceShotMissed]: number = 0;
	[EventType.OnIceTakeaway]: number = 0;
	[EventType.PenaltyAgainst]: number = 0;
	[EventType.PenaltyFor]: number = 0;
	[EventType.Save]: number = 0;
	[EventType.ShootOutGoal]: number = 0;
	[EventType.ShootOutGoalAllowed]: number = 0;
	[EventType.ShootOutMiss]: number = 0;
	[EventType.ShootOutOnIceMiss]: number = 0;
	[EventType.ShootOutSave]: number = 0;
	[EventType.ShootOutShot]: number = 0;
	[EventType.Shot]: number = 0;
	[EventType.ShotBlocked]: number = 0;
	[EventType.ShotMissed]: number = 0;
	[EventType.Takeaway]: number = 0;
}

export class ZoneStarts {
	offensiveStarts: number = 0;
	neutralStarts: number = 0;
	defensiveStarts: number = 0;
}

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {
	getFilterSql(filterConditions: FilterConditions): string {
		let sql: string = `
			WHERE timestamp >= '${filterConditions.startDate}'
			AND timestamp <= '${filterConditions.endDate}'
			AND "playTime" >= ${filterConditions.startTime}
			AND "playTime" <= ${filterConditions.endTime}
		`;

		if (filterConditions.gameType) sql = sql + `\n AND "gameType" = '${filterConditions.gameType}'`;

		if (filterConditions.strength) {
			for (const item of filterConditions.strength) {
				sql = sql + `\n AND "${item[0]}" ${item[1]} ${isNaN(parseInt(item[2])) ? `"${item[2]}"` : item[2]}`;
			}
		}
		return sql;
	}

	async getEventCounts(filterConditions: FilterConditions, playerIds?: number[], teamIds?: number[]): Promise<Map<number, EventCounts>> {
		let sql: string = '';
		if (playerIds) {
			sql = `
				SELECT "playerId" as id, type, count(type)
				FROM events
				${this.getFilterSql(filterConditions)}
				AND "playerId" IN(${playerIds.join(`,`)})
				GROUP BY "playerId", type
			`;
		} else if (teamIds) {
			sql = `
				SELECT "teamId" as id, type, count(type)
				FROM events
				${this.getFilterSql(filterConditions)}
				AND "teamId" IN(${teamIds.join(`,`)})
				GROUP BY "teamId", type
			`;
		}

		const results: any[] = await this.query(sql);

		const countsMap: Map<number, EventCounts> = new Map<number, EventCounts>();

		for (const result of results) {
			let counts: EventCounts;
			if (!countsMap.has(result.id)) {
				counts = new EventCounts();
			} else {
				counts = countsMap.get(result.id)!;
			}
			counts[result.type] = parseInt(result.count);
			countsMap.set(result.id, counts);
		}

		return countsMap;
	}

	async getZoneStarts(filterConditions: FilterConditions, playerIds: number[]): Promise<Map<number, ZoneStarts>> {
		const sql: string = `
			SELECT "playerId", zone, count(zone)
			FROM events
			${this.getFilterSql(filterConditions)}
			AND "playerId" IN (${playerIds.join(`,`)})
			AND type IN ('${[EventType.FaceoffWin, EventType.FaceoffLoss, EventType.OnIceFaceoffWin, EventType.OnIceFaceoffLoss].join(`','`)}')
			GROUP BY "playerId", zone
		`;

		const results: any[] = await this.query(sql);

		const zoneStartsMap: Map<number, ZoneStarts> = new Map<number, ZoneStarts>();

		for (const result of results) {
			let zoneStarts: ZoneStarts;
			if (!zoneStartsMap.has(result.playerId)) {
				zoneStarts = new ZoneStarts();
			} else {
				zoneStarts = zoneStartsMap.get(result.playerId)!;
			}
			const count: number = parseInt(result.count);
			switch (result.zone) {
				case Zone.Offensive:
					zoneStarts.offensiveStarts = count;
					break;
				case Zone.Neutral:
					zoneStarts.neutralStarts = count;
					break;
				case Zone.Defensive:
					zoneStarts.defensiveStarts = count;
					break;
			}
			zoneStartsMap.set(result.playerId, zoneStarts);
		}

		return zoneStartsMap;
	}

	async getTopIds(filterConditions: FilterConditions, queryConditions: QueryConditions): Promise<number[]> {
		let forTypes: EventType[] = [];
		let againstTypes: EventType[] = [];
		switch (queryConditions.sort) {
			case Sort.Goals:
				forTypes = [EventType.Goal];
				break;
			case Sort.Assists:
				forTypes = [EventType.Assist];
				break;
			case Sort.Points:
				forTypes = [EventType.Goal, EventType.Assist];
				break;
			case Sort.CorsiForPercentage:
				forTypes = [
					EventType.Goal,
					EventType.Assist,
					EventType.Shot,
					EventType.ShotBlocked,
					EventType.ShotMissed,
					EventType.OnIceGoal,
					EventType.OnIceShot,
					EventType.OnIceShotBlocked,
					EventType.OnIceShotMissed,
				];
				againstTypes = [EventType.OnIceGoalAllowed, EventType.OnIceSave, EventType.BlockedShot, EventType.OnIceBlockedShot, EventType.OnIceMissedShot];
				break;
			case Sort.FenwickForPercentage:
				forTypes = [
					EventType.Goal,
					EventType.Assist,
					EventType.Shot,
					EventType.ShotMissed,
					EventType.OnIceGoal,
					EventType.OnIceShot,
					EventType.OnIceShotMissed,
				];
				againstTypes = [EventType.OnIceGoalAllowed, EventType.OnIceSave, EventType.OnIceMissedShot];
				break;
			case Sort.OffensiveZoneStartsPercentage:
				break;
			case Sort.PDO:
				break;
		}

		if (forTypes.length && againstTypes.length) {
			const sql: string = `
				SELECT f."playerId", (f.count / (f.count + a.count)) as stat
				FROM (
					SELECT "playerId", cast(count(type) as decimal)
					FROM events
					${this.getFilterSql(filterConditions)}
					AND type in ('${forTypes.join(`','`)}')
					AND "playerType" != 'G'
					GROUP BY "playerId"
				) AS f 
				INNER JOIN (
					SELECT "playerId", cast(count(type) as decimal)
					FROM events
					${this.getFilterSql(filterConditions)}
					AND type in ('${againstTypes.join(`','`)}')
					AND "playerType" != 'G'
					GROUP BY "playerId"
				) AS a ON f."playerId" = a."playerId"
				WHERE f.count + a.count > 400
				ORDER BY stat ${queryConditions.order}
				OFFSET ${queryConditions.offset}
				LIMIT ${queryConditions.limit}
			`;
			const results: any[] = await this.query(sql);
			return results.map((result: any) => result.playerId);
		} else if (forTypes.length && !againstTypes.length) {
			const sql: string = `
				SELECT "playerId", cast(count(type) as decimal)
				FROM events
				${this.getFilterSql(filterConditions)}
				AND type in ('${forTypes.join(`','`)}')
				AND "playerType" != 'G'
				GROUP BY "playerId"
				ORDER BY count ${queryConditions.order}
				OFFSET ${queryConditions.offset}
				LIMIT ${queryConditions.limit}
			`;
			const results: any[] = await this.query(sql);
			return results.map((result: any) => result.playerId);
		} else {
			return [];
		}
	}
}
