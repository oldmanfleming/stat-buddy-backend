// import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
// import { Player } from './Player';

// @Entity('shift_associations')
// export class ShiftAssociation {
// 	@Column({ type: 'timestamp' })
// 	timestamp!: Date;

// 	@PrimaryColumn()
// 	gamePk!: number;

// 	@ManyToOne(() => Player, (player: Player) => player.id)
// 	@PrimaryColumn({ name: 'playerId' })
// 	playerId!: number;

// 	@ManyToOne(() => Player, (player: Player) => player.id)
// 	@PrimaryColumn({ name: 'teammateId' })
// 	teammateId!: number;

// 	@PrimaryColumn()
// 	teamStrength!: number;

// 	@PrimaryColumn()
// 	opposingStrength!: number;

// 	@Column()
// 	length!: number;
// }
