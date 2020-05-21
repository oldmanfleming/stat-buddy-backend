import { Context, Next } from 'koa';
import { UNAUTHORIZED } from 'http-status-codes';

export default function (ctx: Context, next: Next) {
	const { authorization }: { authorization: string } = ctx.header;

	if (!authorization) {
		ctx.throw(UNAUTHORIZED, 'Unauthorized');
	}

	const [tokenType, token]: string[] = authorization.split(' ');

	if (tokenType.toLowerCase() !== 'bearer' && tokenType.toLowerCase() !== 'token') {
		ctx.throw(UNAUTHORIZED, 'Unauthorized');
	}

	if (!token || token !== process.env.SECRET) {
		ctx.throw(UNAUTHORIZED, 'Unauthorized');
	}

	return next();
}
