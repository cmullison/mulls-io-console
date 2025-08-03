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

type SequentialProps = { input: string };
type SequentialOutput = { copy: string; qualityMetrics?: unknown };

async function sequentialWorkflow(
  props: SequentialProps,
  ctx: { toast: (message: string) => void; openai: OpenAIProvider }
): Promise<SequentialOutput> {
  console.log("Sequential", props);
  // This agent uses a prompt chaining workflow, ideal for tasks that can be decomposed into fixed subtasks.
  // It trades off latency for higher accuracy by making each LLM call an easier task.
  const model = ctx.openai("gpt-4o");

  // First step: Generate marketing copy
  const { text: copy } = await generateText({
    model,
    prompt: `Write persuasive marketing copy for: ${props.input}. Focus on benefits and emotional appeal.`,
  });
  ctx.toast("Copy generated");

  // Perform quality check on copy
  const { object: qualityMetrics } = await generateObject({
    model,
    prompt: `Evaluate this marketing copy for:
    1. Presence of call to action (true/false)
    2. Emotional appeal (1-10)
    3. Clarity (1-10)

    Copy to evaluate: ${copy}`,
    schema: z.object({
      clarity: z.number().min(1).max(10),
      emotionalAppeal: z.number().min(1).max(10),
      hasCallToAction: z.boolean(),
    }),
  });
  ctx.toast("Quality check complete");
  
  // If quality check fails, regenerate with more specific instructions
  if (
    !qualityMetrics.hasCallToAction ||
    qualityMetrics.emotionalAppeal < 7 ||
    qualityMetrics.clarity < 7
  ) {
    const { text: improvedCopy } = await generateText({
      model,
      prompt: `Rewrite this marketing copy with:
      ${!qualityMetrics.hasCallToAction ? "- A clear call to action" : ""}
      ${
        qualityMetrics.emotionalAppeal < 7
          ? "- Stronger emotional appeal"
          : ""
      }
      ${qualityMetrics.clarity < 7 ? "- Improved clarity and directness" : ""}

      Original copy: ${copy}`,
    });
    ctx.toast("Copy improved");
    return { copy: improvedCopy, qualityMetrics };
  }

  return { copy, qualityMetrics };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { input?: { input?: string } };
    const { input } = body;

    if (!input?.input) {
      return NextResponse.json({ error: "Missing input parameter" }, { status: 400 });
    }

    const toastMessages: string[] = [];
    const toast = (message: string) => {
      toastMessages.push(message);
    };

    const result = await sequentialWorkflow(
      { input: input.input },
      { toast, openai }
    );

    return NextResponse.json({
      success: true,
      result,
      messages: toastMessages,
    });
  } catch (error) {
    console.error("Sequential agent error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}