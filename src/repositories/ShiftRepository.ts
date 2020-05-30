import { EntityRepository, Repository } from 'typeorm';

import { Shift } from '../entities/Shift';

@EntityRepository(Shift)
export default class ShiftRepository extends Repository<Shift> {
	// Custom Repository Functions go here.
}
