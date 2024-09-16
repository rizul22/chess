import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";
import { WebSocket } from "ws";
import db from "@repo/db";
import { randomUUID } from "crypto";

export class Game {
  public player1: WebSocket | null;
  public player2: WebSocket | null;
  public board: Chess;
  private startTime: Date;
  private moveCount = 0;
  public gameId: string;
  constructor(player1: WebSocket | null, player2: WebSocket | null) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
    this.gameId = randomUUID();
  }

  async createGameHandler() {
    try {
      await this.createGameInDb();
    } catch (e) {
      console.log(e);
      return;
    }
    if (this.player1)
      this.player1.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {
            color: "white",
            gameId: this.gameId,
          },
        })
      );
    if (this.player2)
      this.player2.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {
            color: "black",
            gameId: this.gameId,
          },
        })
      );
  }

  async createGameInDb() {
    const game = await db.game.create({
      data: {
        id: this.gameId,
        timeControl: "CLASSICAL",
        status: "IN_PROGRESS",
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        whitePlayer: {
          create: {},
        },
        blackPlayer: {
          create: {},
        },
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });
    this.gameId = game.id;
  }

  async makeMoveToDb(move: { from: string; to: string }) {
    await db.$transaction([
      db.move.create({
        data: {
          gameId: this.gameId,
          moveNumber: this.moveCount + 1,
          startFen: move.from,
          endFen: move.to,
          createdAt: new Date(Date.now()),
          notation: this.board.fen(),
        },
      }),
      db.game.update({
        data: {
          currentFen: this.board.fen(),
        },
        where: {
          id: this.gameId,
        },
      }),
    ]);
  }

  async makeMove(socket: WebSocket, move: { from: string; to: string }) {
    // validation the type of move using zod
    if (this.moveCount % 2 === 0 && socket !== this.player1) {
      return;
    }
    if (this.moveCount % 2 === 1 && socket !== this.player2) {
      return;
    }
    try {
      this.board.move(move);
    } catch (e) {
      console.log(e);
      return;
    }
    // db.moves.push(move)
    await this.makeMoveToDb(move);

    if (this.board.isGameOver()) {
      // send the game over message to both players
      if (this.player1) {
        this.player1.send(
          JSON.stringify({
            type: GAME_OVER,
            payload: {
              winner: this.board.turn() === "w" ? "black" : "white",
            },
          })
        );
      }
      if (this.player2) {
        this.player2.send(
          JSON.stringify({
            type: GAME_OVER,
            payload: {
              winner: this.board.turn() === "w" ? "black" : "white",
            },
          })
        );
      }
      return;
    }

    if (this.moveCount % 2 === 0) {
      this.player2?.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    } else {
      this.player1?.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    }

    // send the updated board to both players
    this.moveCount++;
  }
}
