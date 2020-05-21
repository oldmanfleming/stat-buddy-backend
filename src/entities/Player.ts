import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Event } from './Event';

@Entity('players')
export class Player {
	@PrimaryColumn()
	id!: number;

	@Column()
	fullName!: string;

	@Column()
	firstName!: string;

	@Column({ nullable: true })
	primaryNumber!: number;

	@Column()
	birthDate!: string;

	@Column({ nullable: true })
	currentAge?: number;

	@Column()
	birthCity!: string;

	@Column()
	birthCountry!: string;

	@Column()
	nationality!: string;

	@Column()
	height!: string;

	@Column()
	weight!: number;

	@Column()
	active!: boolean;

	@Column({ nullable: true })
	alternateCaptain?: boolean;

	@Column({ nullable: true })
	captain?: boolean;

	@Column()
	rookie!: boolean;

	@Column()
	shootsCatches!: string;

	@Column()
	rosterStatus!: string;

	@Column({ nullable: true })
	currentTeamId?: number;

	@Column()
	primaryPosition!: string;

	@OneToMany(() => Event, (event: Event) => event.playerId)
	events!: Event[];
}
