import { Context, Next } from 'koa';
import { assert, string, object, number, array } from '@hapi/joi';

export default function validateFilter(ctx: Context, next: Next) {
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
