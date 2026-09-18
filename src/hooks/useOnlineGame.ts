import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Chess, capturedGlyphs, pairMoves, type Move, type Square } from "@/lib/chess-engine";

export type OnlineRow = {
  id: string;
  code: string;
  fen: string;
  pgn: string;
  last_from: string | null;
  last_to: string | null;
  white_token: string | null;
  black_token: string | null;
  status: string;
  base_seconds: number;
  white_clock: number;
  black_clock: number;
};

const TOKEN_KEY = "chessbar-online-token";

function localToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    "",
  );
}

export function useOnlineGame() {
  const [token, setToken] = useState("");
  const [row, setRow] = useState<OnlineRow | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gameRef = useRef(new Chess());

  useEffect(() => setToken(localToken()), []);

  // Rebuild the local chess instance whenever a new position arrives.
  useEffect(() => {
    if (!row) return;
    const next = new Chess();
    try {
      next.load(row.fen);
    } catch {
      /* ignore malformed position */
    }
    gameRef.current = next;
    setSelected(null);
  }, [row?.fen, row?.id]);

  // Realtime sync on the current room.
  useEffect(() => {
    if (!row?.id) return;
    const channel = supabase
      .channel(`online-game-${row.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "online_games", filter: `id=eq.${row.id}` },
        (payload) => setRow(payload.new as OnlineRow),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [row?.id]);

  const color: "w" | "b" | null = !row
    ? null
    : row.white_token === token
      ? "w"
      : row.black_token === token
        ? "b"
        : null;

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
      const { data, error: err } = await supabase
        .from("online_games")
        .insert({
          code: makeCode(),
          white_token: token,
          base_seconds: seconds,
          white_clock: seconds,
          black_clock: seconds,
          status: "waiting",
        })
        .select()
        .single();
      setBusy(false);
      if (err || !data) {
        setError("Impossible de créer la partie. Réessaie.");
        return;
      }
      setRow(data as OnlineRow);
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
      const { data: found } = await supabase
        .from("online_games")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (!found) {
        setBusy(false);
        setError("Aucune partie avec ce code.");
        return;
      }

      const existing = found as OnlineRow;
      if (existing.white_token === token || existing.black_token === token) {
        setBusy(false);
        setRow(existing);
        return;
      }
      if (existing.black_token) {
        setBusy(false);
        setError("Cette partie est déjà complète.");
        return;
      }

      const { data, error: err } = await supabase
        .from("online_games")
        .update({ black_token: token, status: "playing" })
        .eq("id", existing.id)
        .is("black_token", null)
        .select()
        .single();
      setBusy(false);
      if (err || !data) {
        setError("La place vient d'être prise.");
        return;
      }
      setRow(data as OnlineRow);
    },
    [token],
  );

  const refresh = useCallback(async () => {
    if (!row?.id) return;
    const { data } = await supabase.from("online_games").select("*").eq("id", row.id).maybeSingle();
    if (data) setRow(data as OnlineRow);
  }, [row?.id]);

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
          void supabase
            .from("online_games")
            .update({ fen, pgn, last_from: played.from, last_to: played.to })
            .eq("id", row.id);
          return;
        }
      }

      const piece = current.get(square);
      setSelected(piece && piece.color === current.turn() ? square : null);
    },
    [row, myTurn, selected],
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
