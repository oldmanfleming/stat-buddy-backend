import { EntityRepository, Repository, SelectQueryBuilder, Between } from 'typeorm';

import { Event, EventType } from '../entities/Event';
import { FilterConditions } from '../controllers/StatsController';

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

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {
	getEventFilterQuery(filterConditions: FilterConditions): SelectQueryBuilder<Event> {
		const {
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
		} = filterConditions;

		let query: SelectQueryBuilder<Event> = this.createQueryBuilder('event').where({
			timestamp: Between(startDate, endDate),
			playTime: Between(startTime, endTime),
		});

		if (gameType) {
			query = query.andWhere('event."gameType" = :gameType', { gameType });
		}

		if (strength) {
			for (const item of strength) {
				const queryString: string = `event."${item[0]}" ${item[1]} ${isNaN(parseInt(item[2])) ? `event."${item[2]}"` : item[2]}`;
				query = query.andWhere(queryString);
			}
		}

		if (playerIds) {
			query = query.andWhere('event."playerId" IN (:...playerIds)', { playerIds });
		} else if (teamIds) {
			query = query.andWhere('event."teamId" IN (:...teamIds)', { teamIds });
		}

		return query;
	}

	async getEventCounts(filterConditions: FilterConditions): Promise<Map<number, EventCounts>> {
		let query: SelectQueryBuilder<Event> = this.getEventFilterQuery(filterConditions);

		if (filterConditions.playerIds) {
			query = query.select(['event."playerId"', 'event.type', 'count(event.type)']);
		}
		query = query.groupBy('event."playerId"').addGroupBy('event.type');

		const results: any[] = await query.getRawMany();

		const countsMap: Map<number, EventCounts> = new Map<number, EventCounts>();

		for (const result of results) {
			let counts: EventCounts;
			if (!countsMap.has(result.playerId)) {
				counts = new EventCounts();
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				counts = countsMap.get(result.playerId)!;
			}
			counts[result.event_type] = parseInt(result.count);
			countsMap.set(result.playerId, counts);
		}

		return countsMap;
	}
}
