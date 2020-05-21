import { EntityRepository, Repository } from 'typeorm';

import { Player } from '../entities/Player';

@EntityRepository(Player)
export default class PlayerRepository extends Repository<Player> {
	// Custom Repository Functions go here.
}
