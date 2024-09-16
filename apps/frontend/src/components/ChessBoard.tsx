import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../screens/Game";

export const ChessBoard = ({
  chess,
  board,
  socket,
  setBoard,
}: {
  chess: Chess;
  setBoard: React.Dispatch<
    React.SetStateAction<
      ({
        square: Square;
        type: PieceSymbol;
        color: Color;
      } | null)[][]
    >
  >;
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket | null;
}) => {
  const [from, setFrom] = useState<null | Square>(null);

  return (
    <div className="text-white-200">
      {board.map((row, i) => {
        return (
          <div key={i} className="flex">
            {row.map((square, j) => {
              const squareRepresenation = (String.fromCharCode(97 + (j % 8)) +
                "" +
                (8 - i)) as Square;
              return (
                <div
                  onClick={() => {
                    if (!from) {
                      setFrom(square?.square ?? null);
                    } else {
                      socket?.send(
                        JSON.stringify({
                          type: MOVE,
                          payload: {
                            move: {
                              from,
                              to: squareRepresenation,
                            },
                          },
                        })
                      );
                      setFrom(null);
                      chess.move({
                        from: from as Square,
                        to: squareRepresenation,
                      });
                      setBoard(chess.board());
                      console.log({ from, squareRepresenation });
                    }
                  }}
                  key={j}
                  className={`w-16 h-16 ${
                    (i + j) % 2 === 0 ? "bg-green-500" : "bg-white"
                  }`}
                >
                  <div className="w-full justify-center flex h-full">
                    <div className="h-full justify-center flex flex-col ">
                      {square ? (
                        <img
                          src={`./${
                            square?.color === "b"
                              ? square?.type
                              : `${square?.type?.toUpperCase()}`
                          }.png`}
                          alt=""
                        />
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
