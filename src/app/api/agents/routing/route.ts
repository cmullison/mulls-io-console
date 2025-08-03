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

type RoutingProps = { query: string };
type RoutingOutput = { response: string; classification?: unknown };

async function routingWorkflow(
  props: RoutingProps,
  ctx: { toast: (message: string) => void; openai: OpenAIProvider }
): Promise<RoutingOutput> {
  // This agent uses a routing workflow, which classifies input and directs it to specialized follow-up tasks.
  // It is effective for complex tasks with distinct categories that are better handled separately.
  const model = ctx.openai("gpt-4o");

  // First step: Classify the query type
  const { object: classification } = await generateObject({
    model,
    prompt: `Classify this customer query:
    ${props.query}

    Determine:
    1. Query type (general, refund, or technical)
    2. Complexity (simple or complex)
    3. Brief reasoning for classification`,
    schema: z.object({
      complexity: z.enum(["simple", "complex"]),
      reasoning: z.string(),
      type: z.enum(["general", "refund", "technical"]),
    }),
  });
  ctx.toast("Query classified");
  
  // Route based on classification
  // Set model and system prompt based on query type and complexity
  const { text: response } = await generateText({
    model:
      classification.complexity === "simple"
        ? ctx.openai("gpt-4o-mini")
        : ctx.openai("o1-mini"),
    prompt: props.query,
    system: {
      general:
        "You are an expert customer service agent handling general inquiries.",
      refund:
        "You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.",
      technical:
        "You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.",
    }[classification.type],
  });
  ctx.toast("Response generated");
  
  return { classification, response };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { input?: { query?: string } };
    const { input } = body;

    if (!input?.query) {
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }

    const toastMessages: string[] = [];
    const toast = (message: string) => {
      toastMessages.push(message);
    };

    const result = await routingWorkflow(
      { query: input.query },
      { toast, openai }
    );

    return NextResponse.json({
      success: true,
      result,
      messages: toastMessages,
    });
  } catch (error) {
    console.error("Routing agent error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}