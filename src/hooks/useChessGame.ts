import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Chess,
  botThinkTime,
  capturedGlyphs,
  pairMoves,
  pickBotMove,
  type Move,
  type Square,
} from "@/lib/chess-engine";

export type TimeControl = { label: string; seconds: number };

export function useChessGame(initialSeconds = 300, initialElo = 1500) {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [whiteClock, setWhiteClock] = useState(initialSeconds);
  const [blackClock, setBlackClock] = useState(initialSeconds);
  const [flagged, setFlagged] = useState<"w" | "b" | null>(null);
  const [elo, setElo] = useState(initialElo);


  const game = gameRef.current;
  const turn = game.turn();
  const gameOver = game.isGameOver() || flagged !== null;

  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      if (turn === "w") {
        setWhiteClock((s) => {
          if (s <= 1) {
            setFlagged("w");
            return 0;
          }
          return s - 1;
        });
      } else {
        setBlackClock((s) => {
          if (s <= 1) {
            setFlagged("b");
            return 0;
          }
          return s - 1;
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [turn, gameOver, fen]);

  const legalTargets = useMemo(() => {
    if (!selected) return [] as Square[];
    return (game.moves({ square: selected, verbose: true }) as Move[]).map((m) => m.to as Square);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, fen]);

  const commit = useCallback((move: Move) => {
    setLastMove({ from: move.from as Square, to: move.to as Square });
    setFen(gameRef.current.fen());
    setSelected(null);
  }, []);

  const playSquare = useCallback(
    (square: Square) => {
      if (gameOver || gameRef.current.turn() !== "w") return;
      const piece = gameRef.current.get(square);

      if (selected) {
        const move = (gameRef.current.moves({ square: selected, verbose: true }) as Move[]).find(
          (m) => m.to === square,
        );
        if (move) {
          const played = gameRef.current.move({
            from: selected,
            to: square,
            promotion: "q",
          }) as Move;
          commit(played);
          return;
        }
      }

      setSelected(piece && piece.color === "w" ? square : null);
    },
    [selected, gameOver, commit],
  );

  // Bot answers for black
  useEffect(() => {
    if (gameOver || gameRef.current.turn() !== "b") return;
    const id = setTimeout(() => {
      const move = pickBotMove(gameRef.current, elo);
      if (!move) return;
      const played = gameRef.current.move(move.san) as Move;
      commit(played);
    }, 650);
    return () => clearTimeout(id);
  }, [fen, gameOver, commit, elo]);


  const reset = useCallback(
    (seconds = initialSeconds) => {
      gameRef.current = new Chess();
      setFen(gameRef.current.fen());
      setSelected(null);
      setLastMove(null);
      setFlagged(null);
      setWhiteClock(seconds);
      setBlackClock(seconds);
    },
    [initialSeconds],
  );

  const history = game.history({ verbose: true }) as Move[];

  const status = useMemo(() => {
    if (flagged) return flagged === "w" ? "Time out · you lose" : "Time out · you win";
    if (game.isCheckmate()) return turn === "w" ? "Checkmate · you lose" : "Checkmate · you win";
    if (game.isDraw()) return "Draw";
    if (game.isCheck()) return "Check";
    return `Move ${Math.floor(history.length / 2) + 1}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, flagged]);

  const result: "win" | "loss" | "draw" | null = flagged
    ? flagged === "w"
      ? "loss"
      : "win"
    : game.isCheckmate()
      ? turn === "w"
        ? "loss"
        : "win"
      : game.isDraw()
        ? "draw"
        : null;

  return {
    game,
    fen,
    turn,
    result,
    pgn: game.pgn(),
    selected,
    legalTargets,
    lastMove,
    playSquare,
    reset,
    elo,
    setElo,

    whiteClock,
    blackClock,
    gameOver,
    status,
    moveRows: pairMoves(history),
    whiteCaptured: capturedGlyphs(history, "w"),
    blackCaptured: capturedGlyphs(history, "b"),
    moveCount: history.length,
  };
}
