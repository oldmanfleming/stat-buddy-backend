import { EntityRepository, Repository } from 'typeorm';

import { Summary } from '../entities/Summary';

@EntityRepository(Summary)
export default class SummaryRepository extends Repository<Summary> {
	// Custom Repository Functions go here.
}
