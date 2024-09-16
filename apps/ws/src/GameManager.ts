import { Game } from "./Game";
import { GAME_JOINED, INIT_GAME, JOIN_GAME, MOVE } from "./messages";
import { WebSocket } from "ws";
import db from "@repo/db";

export class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;
  private users: WebSocket[];
  public getInstance() {}

  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }
  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }
  removeUser(socket: WebSocket) {
    this.users = this.users.filter((user) => user !== socket);
    // stop the game here as user left
  }
  private addHandler(socket: WebSocket) {
    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === INIT_GAME) {
        if (this.pendingUser) {
          // start a game
          const game = new Game(this.pendingUser, socket);
          await game.createGameHandler();
          this.games.push(game);
          // store an entry in the database

          this.pendingUser = null;
        } else {
          this.pendingUser = socket;
        }
      }

      if (message.type === MOVE) {
        const game = this.games.find(
          (game) => game.player1 === socket || game.player2 === socket
        );
        if (game) {
          game.makeMove(socket, message.payload.move);
        }
      }
      if (message.type === JOIN_GAME) {
        if (message.payload?.gameId) {
          const {
            payload: { gameId },
          } = message;
          const availableGame = this.games.find(
            (game) => game.gameId === gameId
          );

          if (availableGame) {
            const { player1, player2, gameId, board } = availableGame;
            if (player1 && player2) {
              socket.send(
                JSON.stringify({
                  type: GAME_JOINED,
                  payload: {
                    gameId,
                    board,
                  },
                })
              );
            }
            if (!player1) {
              availableGame.player1 = socket;
              player2?.send(
                JSON.stringify({
                  type: "OPPONENT_JOINED",
                })
              );
            }
            if (!player2) {
              availableGame.player2 = socket;
              player1?.send(
                JSON.stringify({
                  type: "OPPONENT_JOINED",
                })
              );
            }
            socket.send(
              JSON.stringify({
                type: GAME_JOINED,
                payload: {
                  gameId,
                  board,
                },
              })
            );
            return;
          } else {
            // look in db
            const gameFromDb = await db.findUnique({
              where: {
                gameId,
              },
              include: {
                moves: {
                  orderBy: {
                    moveNumber: "asc",
                  },
                },
              },
            });
            const game = new Game(socket, null);
            gameFromDb?.moves.forEach((move: any) => {
              game.board.move(move);
            });
            this.games.push(game);
            socket.send(
              JSON.stringify({
                type: GAME_JOINED,
                payload: {
                  gameId,
                  board: game.board,
                },
              })
            );
          }
        }
      }
    });
  }
}
