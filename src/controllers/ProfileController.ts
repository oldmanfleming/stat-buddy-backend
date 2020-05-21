import { route, GET } from "awilix-koa";
import { OK, NOT_FOUND } from "http-status-codes";
import { Context } from "koa";
import { assert, string } from "@hapi/joi";
import { Connection } from "typeorm";

import PlayerRepository from "../repositories/PlayerRepository";
import { Player } from "../entities/Player";
import TeamRepository from "../repositories/TeamRepository";
import { Team } from "../entities/Team";

@route("/api/profiles")
export default class PlayerController {
  private _playerRepository: PlayerRepository;
  private _teamRepository: TeamRepository;

  // Any Dependencies registered to the container can be injected here
  constructor({ connection }: { connection: Connection }) {
    this._playerRepository = connection.getCustomRepository(PlayerRepository);
    this._teamRepository = connection.getCustomRepository(TeamRepository);
  }

  @route("/player/:id")
  @GET()
  async getPlayer(ctx: Context) {
    assert(
      ctx.params.id,
      string().regex(/^\d+$/),
    );

    const player: Player | undefined = await this._playerRepository.findOne(
      { id: ctx.params.id },
    );

    if (!player) {
      ctx.body = undefined;
      ctx.status = NOT_FOUND;
      return;
    }

    ctx.body = player;
    ctx.status = OK;
  }

  @route("/team/:id")
  @GET()
  async getTeam(ctx: Context) {
    assert(
      ctx.params.id,
      string().regex(/^\d+$/),
    );

    const team: Team | undefined = await this._teamRepository.findOne(
      { id: ctx.params.id },
    );

    if (!team) {
      ctx.body = undefined;
      ctx.status = NOT_FOUND;
      return;
    }

    ctx.body = team;
    ctx.status = OK;
  }

  @route("/search/:name")
  @GET()
  async search(ctx: Context) {
    assert(
      ctx.params.name,
      string().max(50).required(),
    );

    const players: Player[] = await this._playerRepository.createQueryBuilder(
      "players",
    ).where(
      "lower(players.fullName) like lower(:name)",
      { name: `%${ctx.params.name}%` },
    )
      .take(5)
      .getMany();

    const teams: Team[] = await this._teamRepository.createQueryBuilder(
      "teams",
    ).where(
      "lower(teams.name) like lower(:name)",
      { name: `%${ctx.params.name}%` },
    )
      .take(5)
      .getMany();

    const results: any[] = [];

    for (const player of players) {
      results.push({
        type: "player",
        id: player.id,
        name: player.fullName,
      });
    }

    for (const team of teams) {
      results.push({
        type: "team",
        id: team.id,
        name: team.name,
      });
    }

    ctx.body = results;
    ctx.status = OK;
  }
}
