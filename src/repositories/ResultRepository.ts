import { EntityRepository, Repository } from 'typeorm';

import { Result } from '../entities/Result';

@EntityRepository(Result)
export default class ResultRepository extends Repository<Result> {
	// Custom Repository Functions go here.
}
