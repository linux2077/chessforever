import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  pgn: z.string().min(1),
  botElo: z.number(),
  result: z.enum(["win", "loss", "draw"]),
  playerElo: z.number().nullable(),
});

export type CoachMoment = {
  move_number: number;
  played: string;
  better: string;
  tag: string;
  evaluation: string;
  explanation: string;
};

export type CoachReport = {
  summary: string;
  accuracy: number;
  estimated_elo: number;
  opening: string;
  phases: { opening: string; middlegame: string; endgame: string };
  counts: { blunders: number; mistakes: number; inaccuracies: number; good_moves: number };
  strengths: string[];
  weaknesses: string[];
  training: string[];
  moments: CoachMoment[];
};

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description: "Bilan global de la partie pour les blancs, en francais, 3 a 4 phrases.",
    },
    accuracy: { type: "number", description: "Precision des blancs de 0 a 100." },
    estimated_elo: {
      type: "number",
      description: "Elo estime des blancs sur cette partie, base sur la qualite des coups.",
    },
    opening: { type: "string", description: "Nom de l'ouverture jouee." },
    phases: {
      type: "object",
      additionalProperties: false,
      properties: {
        opening: { type: "string", description: "Analyse de l'ouverture, 1 a 2 phrases." },
        middlegame: { type: "string", description: "Analyse du milieu de partie." },
        endgame: {
          type: "string",
          description: "Analyse de la finale, ou pourquoi la partie s'est terminee avant.",
        },
      },
      required: ["opening", "middlegame", "endgame"],
    },
    counts: {
      type: "object",
      additionalProperties: false,
      properties: {
        blunders: { type: "number" },
        mistakes: { type: "number" },
        inaccuracies: { type: "number" },
        good_moves: { type: "number" },
      },
      required: ["blunders", "mistakes", "inaccuracies", "good_moves"],
    },
    strengths: { type: "array", items: { type: "string" }, description: "2 a 3 points forts." },
    weaknesses: { type: "array", items: { type: "string" }, description: "2 a 3 points faibles." },
    training: {
      type: "array",
      items: { type: "string" },
      description: "3 exercices concrets a travailler.",
    },
    moments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          move_number: { type: "number" },
          played: { type: "string", description: "Coup joue en notation SAN." },
          better: { type: "string", description: "Meilleur coup en notation SAN." },
          tag: {
            type: "string",
            enum: ["gaffe", "erreur", "imprecision", "bon coup", "coup brillant"],
          },
          evaluation: {
            type: "string",
            description: "Evaluation apres le coup, style +0.8 ou -2.3 ou mat en 3.",
          },
          explanation: {
            type: "string",
            description: "Explication pedagogique en francais, 1 a 3 phrases, avec le plan correct.",
          },
        },
        required: ["move_number", "played", "better", "tag", "evaluation", "explanation"],
      },
    },
  },
  required: [
    "summary",
    "accuracy",
    "estimated_elo",
    "opening",
    "phases",
    "counts",
    "strengths",
    "weaknesses",
    "training",
    "moments",
  ],
} as const;

export const analyzeGame = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<CoachReport> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Le coach n'est pas configure (cle AI manquante).");

    const prompt = [
      "Tu es un entraineur d'echecs de niveau maitre. Analyse en detail cette partie",
      `ou l'humain joue les BLANCS contre un bot d'environ ${data.botElo} Elo.`,
      `Resultat pour les blancs: ${data.result}.`,
      data.playerElo ? `Elo actuel estime de l'humain: ${data.playerElo}.` : "",
      "Rejoue mentalement la partie coup par coup et evalue chaque coup des blancs.",
      "Donne: un bilan, une precision sur 100 coherente avec le nombre d'erreurs,",
      "un Elo estime des blancs sur cette partie, le nom de l'ouverture,",
      "une analyse par phase (ouverture, milieu, finale), le decompte de gaffes /",
      "erreurs / imprecisions / bons coups, des points forts, des points faibles,",
      "3 exercices concrets, et jusqu'a 6 moments cles avec le meilleur coup,",
      "une evaluation numerique et une explication pedagogique. Reponds en francais.",
      "",
      "PGN:",
      data.pgn,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        stream: true,
        store: false,
        reasoning: { effort: "medium" },
        text: {
          format: {
            type: "json_schema",
            name: "coach_report",
            strict: true,
            schema: JSON_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Le coach est momentanement surcharge, reessaie.");
      if (res.status === 402 || res.status === 403)
        throw new Error("Credits AI epuises ou bloques pour cet espace de travail.");
      throw new Error(`Analyse impossible (${res.status}). ${detail.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            text += event.delta;
          } else if (event.type === "response.completed" && event.response?.output_text) {
            if (!text) text = event.response.output_text;
          }
        } catch {
          // ignore keep-alive / partial frames
        }
      }
    }

    if (!text.trim()) throw new Error("Le coach n'a rien renvoye, reessaie.");

    let parsed: CoachReport;
    try {
      parsed = JSON.parse(text) as CoachReport;
    } catch {
      throw new Error("Reponse du coach illisible, reessaie.");
    }

    const list = (value: unknown, max = 4) =>
      Array.isArray(value) ? value.map(String).slice(0, max) : [];
    const count = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));

    return {
      summary: String(parsed.summary ?? ""),
      accuracy: Math.max(0, Math.min(100, Math.round(Number(parsed.accuracy) || 0))),
      estimated_elo: Math.max(400, Math.min(2900, Math.round(Number(parsed.estimated_elo) || 0))),
      opening: String(parsed.opening ?? ""),
      phases: {
        opening: String(parsed.phases?.opening ?? ""),
        middlegame: String(parsed.phases?.middlegame ?? ""),
        endgame: String(parsed.phases?.endgame ?? ""),
      },
      counts: {
        blunders: count(parsed.counts?.blunders),
        mistakes: count(parsed.counts?.mistakes),
        inaccuracies: count(parsed.counts?.inaccuracies),
        good_moves: count(parsed.counts?.good_moves),
      },
      strengths: list(parsed.strengths, 3),
      weaknesses: list(parsed.weaknesses, 3),
      training: list(parsed.training, 3),
      moments: Array.isArray(parsed.moments) ? parsed.moments.slice(0, 6) : [],
    };
  });
