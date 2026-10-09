import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createOnlineGame,
  getOnlineGame,
  joinOnlineGame,
  playOnlineMove,
  type PublicGame,
} from "@/lib/online.functions";
import { Chess, capturedGlyphs, pairMoves, type Move, type Square } from "@/lib/chess-engine";

export type OnlineRow = PublicGame;

const TOKEN_KEY = "chessbar-online-token";

// One player identity per browser tab, so two tabs can face each other.
function localToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function useOnlineGame() {
  const [token, setToken] = useState("");
  const [row, setRow] = useState<OnlineRow | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gameRef = useRef(new Chess());
  const [, setVersion] = useState(0);

  useEffect(() => setToken(localToken()), []);

  // Rebuild the local chess instance whenever a new position arrives.
  useEffect(() => {
    if (!row) return;
    const next = new Chess();
    try {
      // PGN keeps the full move history; fall back to the position only.
      if (row.pgn) next.loadPgn(row.pgn);
      if (next.fen() !== row.fen) next.load(row.fen);
    } catch {
      try {
        next.load(row.fen);
      } catch {
        /* ignore malformed position */
      }
    }
    gameRef.current = next;
    setSelected(null);
    setVersion((v) => v + 1);
  }, [row?.fen, row?.id]);

  // Sync with the opponent by polling the server.
  useEffect(() => {
    if (!row?.id || !token) return;
    const id = row.id;
    const poll = setInterval(async () => {
      try {
        const { game } = await getOnlineGame({ data: { token, id } });
        if (game)
          setRow((prev) =>
            prev && prev.fen === game.fen && prev.status === game.status ? prev : game,
          );
      } catch {
        /* network hiccup, retry next tick */
      }
    }, 1200);
    return () => clearInterval(poll);
  }, [row?.id, token]);

  const color = row?.color ?? null;

  const game = gameRef.current;
  const turn = game.turn();
  const gameOver = game.isGameOver();
  const myTurn = color !== null && color === turn && row?.status === "playing" && !gameOver;

  const legalTargets = useMemo(() => {
    if (!selected) return [] as Square[];
    return (game.moves({ square: selected, verbose: true }) as Move[]).map((m) => m.to as Square);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, row?.fen]);

  const createRoom = useCallback(
    async (seconds: number) => {
      setBusy(true);
      setError(null);
      try {
        const res = await createOnlineGame({ data: { token, seconds } });
        if (res.game) setRow(res.game);
        else setError(res.error);
      } catch {
        setError("Impossible de créer la partie. Réessaie.");
      }
      setBusy(false);
    },
    [token],
  );

  const joinRoom = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (code.length < 4) {
        setError("Code invalide.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await joinOnlineGame({ data: { token, code } });
        if (res.game) setRow(res.game);
        else setError(res.error);
      } catch {
        setError("Connexion impossible. Réessaie.");
      }
      setBusy(false);
    },
    [token],
  );

  const refresh = useCallback(async () => {
    if (!row?.id) return;
    const { game } = await getOnlineGame({ data: { token, id: row.id } });
    if (game) setRow(game);
  }, [row?.id, token]);

  const leave = useCallback(() => {
    setRow(null);
    setSelected(null);
    setError(null);
    gameRef.current = new Chess();
  }, []);

  const playSquare = useCallback(
    (square: Square) => {
      if (!row || !myTurn) return;
      const current = gameRef.current;

      if (selected) {
        const legal = (current.moves({ square: selected, verbose: true }) as Move[]).find(
          (m) => m.to === square,
        );
        if (legal) {
          const played = current.move({ from: selected, to: square, promotion: "q" }) as Move;
          const fen = current.fen();
          const pgn = current.pgn();
          setSelected(null);
          setRow({ ...row, fen, pgn, last_from: played.from, last_to: played.to });
          void playOnlineMove({ data: { token, id: row.id, from: played.from, to: played.to } })
            .then((res) => {
              if (res.game) setRow(res.game);
              if (res.error) setError(res.error);
            })
            .catch(() => setError("Coup non synchronisé. Rafraîchis."));
          return;
        }
      }

      const piece = current.get(square);
      setSelected(piece && piece.color === current.turn() ? square : null);
    },
    [row, myTurn, selected, token],
  );

  const history = game.history({ verbose: true }) as Move[];

  const status = (() => {
    if (!row) return "Pas de partie";
    if (row.status === "waiting") return "En attente de l'adversaire";
    if (game.isCheckmate()) return turn === color ? "Échec et mat · tu perds" : "Échec et mat · tu gagnes";
    if (game.isDraw()) return "Partie nulle";
    if (game.isCheck()) return "Échec";
    return myTurn ? "À toi de jouer" : "Au tour de l'adversaire";
  })();

  return {
    game,
    row,
    code: row?.code ?? null,
    color,
    turn,
    myTurn,
    selected,
    legalTargets,
    lastMove:
      row?.last_from && row?.last_to
        ? { from: row.last_from as Square, to: row.last_to as Square }
        : null,
    playSquare,
    createRoom,
    joinRoom,
    refresh,
    leave,
    busy,
    error,
    status,
    gameOver,
    moveRows: pairMoves(history),
    whiteCaptured: capturedGlyphs(history, "w"),
    blackCaptured: capturedGlyphs(history, "b"),
    moveCount: history.length,
  };
}
