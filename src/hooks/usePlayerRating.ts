import { useCallback, useEffect, useState } from "react";

const KEY = "chessbar-elo";
const START = 1200;

type Saved = { rating?: number; games?: number; peak?: number; wins?: number; draws?: number; losses?: number };

/** K-factor style FIDE/Glicko simplifié : élevé en phase provisoire, réduit ensuite. */
export function kFactor(games: number, rating: number) {
  if (games < 10) return 40;
  if (rating >= 2400) return 10;
  if (rating >= 2000) return 16;
  return 24;
}

export function expectedScore(me: number, opponent: number) {
  return 1 / (1 + 10 ** ((opponent - me) / 400));
}

export function nextRating(me: number, opponent: number, score: number, games = 30) {
  const k = kFactor(games, me);
  return Math.max(100, Math.round(me + k * (score - expectedScore(me, opponent))));
}

export function usePlayerRating() {
  const [rating, setRating] = useState(START);
  const [games, setGames] = useState(0);
  const [peak, setPeak] = useState(START);
  const [record, setRecord] = useState({ wins: 0, draws: 0, losses: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        if (typeof saved.rating === "number") setRating(saved.rating);
        if (typeof saved.games === "number") setGames(saved.games);
        setPeak(typeof saved.peak === "number" ? saved.peak : (saved.rating ?? START));
        setRecord({
          wins: saved.wins ?? 0,
          draws: saved.draws ?? 0,
          losses: saved.losses ?? 0,
        });
      }
    } catch {
      // ignore corrupted storage
    }
    setReady(true);
  }, []);

  const applyResult = useCallback(
    (opponentElo: number, score: number) => {
      const updated = nextRating(rating, opponentElo, score, games);
      const nextGames = games + 1;
      const nextPeak = Math.max(peak, updated);
      const nextRecord = {
        wins: record.wins + (score === 1 ? 1 : 0),
        draws: record.draws + (score === 0.5 ? 1 : 0),
        losses: record.losses + (score === 0 ? 1 : 0),
      };
      setRating(updated);
      setGames(nextGames);
      setPeak(nextPeak);
      setRecord(nextRecord);
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify({ rating: updated, games: nextGames, peak: nextPeak, ...nextRecord }),
        );
      } catch {
        // ignore storage errors
      }
    },
    [rating, games, peak, record],
  );

  return {
    rating,
    games,
    peak,
    record,
    provisional: games < 10,
    ready,
    applyResult,
    expectedVs: (opponentElo: number) => expectedScore(rating, opponentElo),
  };
}
