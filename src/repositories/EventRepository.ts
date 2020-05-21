import { EntityRepository, Repository } from "typeorm";

import { Event } from "../entities/Event";

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {
  // Custom Repository Functions go here.
}
