import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  pgn: z.string().min(1),
  botElo: z.number(),
  result: z.enum(["win", "loss", "draw"]),
});

export type CoachMoment = {
  move_number: number;
  played: string;
  better: string;
  explanation: string;
};

export type CoachReport = {
  summary: string;
  accuracy: number;
  estimated_elo: number;
  moments: CoachMoment[];
};

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description: "Bilan global de la partie pour les blancs, en francais, 2 a 3 phrases.",
    },
    accuracy: { type: "number", description: "Precision des blancs de 0 a 100." },
    estimated_elo: { type: "number", description: "Elo estime des blancs sur cette partie." },
    moments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          move_number: { type: "number" },
          played: { type: "string", description: "Coup joue en notation SAN." },
          better: { type: "string", description: "Meilleur coup en notation SAN." },
          explanation: { type: "string", description: "Explication courte en francais." },
        },
        required: ["move_number", "played", "better", "explanation"],
      },
    },
  },
  required: ["summary", "accuracy", "estimated_elo", "moments"],
} as const;

export const analyzeGame = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<CoachReport> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Le coach n'est pas configure (cle AI manquante).");

    const prompt = [
      "Tu es un entraineur d'echecs. Analyse cette partie ou l'humain joue les BLANCS",
      `contre un bot d'environ ${data.botElo} Elo. Resultat pour les blancs: ${data.result}.`,
      "Donne un bilan, une precision sur 100, un Elo estime des blancs sur cette partie,",
      "et jusqu'a 4 moments cles (coups des blancs) avec le meilleur coup et une explication",
      "courte et pedagogique. Reponds en francais.",
      "",
      "PGN:",
      data.pgn,
    ].join("\n");

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
        reasoning: { effort: "low" },
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

    return {
      summary: String(parsed.summary ?? ""),
      accuracy: Math.max(0, Math.min(100, Math.round(Number(parsed.accuracy) || 0))),
      estimated_elo: Math.max(400, Math.min(2900, Math.round(Number(parsed.estimated_elo) || 0))),
      moments: Array.isArray(parsed.moments) ? parsed.moments.slice(0, 6) : [],
    };
  });
