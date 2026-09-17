import { useCallback, useEffect, useState } from "react";

const KEY = "chessbar-elo";
const START = 1200;
const K = 24;

export function expectedScore(me: number, opponent: number) {
  return 1 / (1 + 10 ** ((opponent - me) / 400));
}

export function nextRating(me: number, opponent: number, score: number) {
  return Math.round(me + K * (score - expectedScore(me, opponent)));
}

export function usePlayerRating() {
  const [rating, setRating] = useState(START);
  const [games, setGames] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { rating?: number; games?: number };
        if (typeof saved.rating === "number") setRating(saved.rating);
        if (typeof saved.games === "number") setGames(saved.games);
      }
    } catch {
      // ignore corrupted storage
    }
    setReady(true);
  }, []);

  const applyResult = useCallback((opponentElo: number, score: number) => {
    setRating((current) => {
      const updated = nextRating(current, opponentElo, score);
      setGames((g) => {
        try {
          localStorage.setItem(KEY, JSON.stringify({ rating: updated, games: g + 1 }));
        } catch {
          // ignore storage errors
        }
        return g + 1;
      });
      return updated;
    });
  }, []);

  return { rating, games, ready, applyResult };
}
