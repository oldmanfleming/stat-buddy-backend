import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Event } from './Event';

@Entity('teams')
export class Team {
	@PrimaryColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	venue!: string;

	@Column()
	city!: string;

	@Column()
	abbreviation!: string;

	@Column()
	teamName!: string;

	@Column()
	locationName!: string;

	@Column()
	division!: string;

	@Column()
	divisionId!: number;

	@Column()
	conference!: string;

	@Column()
	conferenceId!: number;

	@OneToMany(() => Event, (event: Event) => event.teamId)
	events!: Event[];
}
