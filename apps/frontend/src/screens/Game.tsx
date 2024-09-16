import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";
// TODO: Move together, there's code repetion here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";

export const Game = () => {
  const socket = useSocket();
  const [chess, _setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);

      switch (message.type) {
        case INIT_GAME:
          setBoard(chess.board());
          setStarted(true);
          break;
        case MOVE:
          const move = message.payload;
          chess.move(move);
          setBoard(chess.board());
          console.log("Move made");
          break;
        case GAME_OVER:
          console.log("Game over");
          break;
      }
    };
  }, [socket]);

  return (
    <div className="justify-center flex">
      <div className="pt-8 max-w-screen-lg w-full">
        <div className="grid grid-cols-6 gap-4 w-full ">
          <div className="col-span-4 w-full flex justify-center">
            <ChessBoard
              chess={chess}
              board={board}
              socket={socket}
              setBoard={setBoard}
            />
          </div>
          <div className="col-span-2 bg-slate-900 w-full">
            <div className="flex justify-center p-4">
              {!started && (
                <Button
                  onClick={() => {
                    socket?.send(
                      JSON.stringify({
                        type: INIT_GAME,
                      })
                    );
                  }}
                >
                  Play
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
