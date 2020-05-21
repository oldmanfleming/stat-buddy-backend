import { EntityRepository, Repository } from 'typeorm';

import { Team } from '../entities/Team';

@EntityRepository(Team)
export default class TeamRepository extends Repository<Team> {
	// Custom Repository Functions go here.
}
