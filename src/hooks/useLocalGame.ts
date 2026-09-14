import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, capturedGlyphs, pairMoves, type Move, type Square } from "@/lib/chess-engine";

/** Two humans sharing one device: both colours are playable, no bot. */
export function useLocalGame(initialSeconds = 300) {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [whiteClock, setWhiteClock] = useState(initialSeconds);
  const [blackClock, setBlackClock] = useState(initialSeconds);
  const [flagged, setFlagged] = useState<"w" | "b" | null>(null);
  const [paused, setPaused] = useState(false);
  const [autoFlip, setAutoFlip] = useState(true);

  const game = gameRef.current;
  const turn = game.turn();
  const started = game.history().length > 0;
  const gameOver = game.isGameOver() || flagged !== null;

  useEffect(() => {
    if (gameOver || paused || !started) return;
    const id = setInterval(() => {
      const tick = (s: number, color: "w" | "b") => {
        if (s <= 1) {
          setFlagged(color);
          return 0;
        }
        return s - 1;
      };
      if (turn === "w") setWhiteClock((s) => tick(s, "w"));
      else setBlackClock((s) => tick(s, "b"));
    }, 1000);
    return () => clearInterval(id);
  }, [turn, gameOver, paused, started, fen]);

  const legalTargets = useMemo(() => {
    if (!selected) return [] as Square[];
    return (game.moves({ square: selected, verbose: true }) as Move[]).map((m) => m.to as Square);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, fen]);

  const playSquare = useCallback(
    (square: Square) => {
      if (gameOver || paused) return;
      const current = gameRef.current;

      if (selected) {
        const move = (current.moves({ square: selected, verbose: true }) as Move[]).find(
          (m) => m.to === square,
        );
        if (move) {
          const played = current.move({ from: selected, to: square, promotion: "q" }) as Move;
          setLastMove({ from: played.from as Square, to: played.to as Square });
          setFen(current.fen());
          setSelected(null);
          return;
        }
      }

      const piece = current.get(square);
      setSelected(piece && piece.color === current.turn() ? square : null);
    },
    [selected, gameOver, paused],
  );

  const undo = useCallback(() => {
    if (!gameRef.current.undo()) return;
    setFen(gameRef.current.fen());
    setSelected(null);
    setLastMove(null);
    setFlagged(null);
  }, []);

  const reset = useCallback(
    (seconds = initialSeconds) => {
      gameRef.current = new Chess();
      setFen(gameRef.current.fen());
      setSelected(null);
      setLastMove(null);
      setFlagged(null);
      setPaused(false);
      setWhiteClock(seconds);
      setBlackClock(seconds);
    },
    [initialSeconds],
  );

  const history = game.history({ verbose: true }) as Move[];

  const status = useMemo(() => {
    if (flagged) return flagged === "w" ? "White flagged · Black wins" : "Black flagged · White wins";
    if (game.isCheckmate()) return turn === "w" ? "Checkmate · Black wins" : "Checkmate · White wins";
    if (game.isDraw()) return "Draw";
    if (game.isCheck()) return "Check";
    return `Move ${Math.floor(history.length / 2) + 1}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, flagged]);

  return {
    game,
    turn,
    selected,
    legalTargets,
    lastMove,
    playSquare,
    undo,
    reset,
    paused,
    setPaused,
    autoFlip,
    setAutoFlip,
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
