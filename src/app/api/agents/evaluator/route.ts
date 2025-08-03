import { type OpenAIProvider, createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Environment variables for Next.js
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || `https://gateway.ai.cloudflare.com/v1/${process.env.AI_GATEWAY_ACCOUNT_ID}/${process.env.AI_GATEWAY_ID}/openai`,
  headers: process.env.AI_GATEWAY_TOKEN ? {
    "cf-aig-authorization": `Bearer ${process.env.AI_GATEWAY_TOKEN}`,
  } : undefined,
});

type EvaluatorProps = { text: string; targetLanguage: string };
type EvaluatorOutput = {
  finalTranslation: string;
  iterationsRequired: number;
};

async function evaluatorWorkflow(
  props: EvaluatorProps,
  ctx: { toast: (message: string) => void; openai: OpenAIProvider }
): Promise<EvaluatorOutput> {
  const model = ctx.openai("gpt-4o");

  let currentTranslation = "";
  let iterations = 0;
  const MAX_ITERATIONS = 1;

  // Initial translation
  const { text: translation } = await generateText({
    model: ctx.openai("gpt-4o-mini"), // use small model for first attempt
    prompt: `Translate this text to ${props.targetLanguage}, preserving tone and cultural nuances:
    ${props.text}`,
    system: "You are an expert literary translator.",
  });

  ctx.toast("Initial translation complete");

  currentTranslation = translation;

  // Evaluation-optimization loop
  while (iterations < MAX_ITERATIONS) {
    // Evaluate current translation
    const { object: evaluation } = await generateObject({
      model,
      prompt: `Evaluate this translation:

      Original: ${props.text}
      Translation: ${currentTranslation}

      Consider:
      1. Overall quality
      2. Preservation of tone
      3. Preservation of nuance
      4. Cultural accuracy`,
      schema: z.object({
        culturallyAccurate: z.boolean(),
        improvementSuggestions: z.array(z.string()),
        preservesNuance: z.boolean(),
        preservesTone: z.boolean(),
        qualityScore: z.number().min(1).max(10),
        specificIssues: z.array(z.string()),
      }),
      system: "You are an expert in evaluating literary translations.",
    });

    ctx.toast(`Evaluation complete: ${evaluation.qualityScore}`);

    // Check if quality meets threshold
    if (
      evaluation.qualityScore >= 8 &&
      evaluation.preservesTone &&
      evaluation.preservesNuance &&
      evaluation.culturallyAccurate
    ) {
      break;
    }

    // Generate improved translation based on feedback
    const { text: improvedTranslation } = await generateText({
      model: ctx.openai("gpt-4o"), // use a larger model
      prompt: `Improve this translation based on the following feedback:
      ${evaluation.specificIssues.join("\n")}
      ${evaluation.improvementSuggestions.join("\n")}

      Original: ${props.text}
      Current Translation: ${currentTranslation}`,
      system: "You are an expert literary translator.",
    });

    ctx.toast("Improved translation complete");

    currentTranslation = improvedTranslation;
    iterations++;
  }

  ctx.toast("Final translation complete");

  return {
    finalTranslation: currentTranslation,
    iterationsRequired: iterations,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { input?: { text?: string; targetLanguage?: string } };
    const { input } = body;

    if (!input?.text || !input?.targetLanguage) {
      return NextResponse.json({ error: "Missing text or targetLanguage parameter" }, { status: 400 });
    }

    const toastMessages: string[] = [];
    const toast = (message: string) => {
      toastMessages.push(message);
    };

    const result = await evaluatorWorkflow(
      { text: input.text, targetLanguage: input.targetLanguage },
      { toast, openai }
    );

    return NextResponse.json({
      success: true,
      result,
      messages: toastMessages,
    });
  } catch (error) {
    console.error("Evaluator agent error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}