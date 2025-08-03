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

type ParallelProps = { code: string };
type ParallelOutput = { reviews: unknown; summary: string };

async function parallelWorkflow(
  props: ParallelProps,
  ctx: { toast: (message: string) => void; openai: OpenAIProvider }
): Promise<ParallelOutput> {
  // This agent uses a parallelization workflow, effective for tasks that can be divided into independent subtasks.
  // It allows for speed and multiple perspectives, improving confidence in results.
  const model = ctx.openai("gpt-4o");

  // Run parallel reviews
  const [securityReview, performanceReview, maintainabilityReview] =
    await Promise.all([
      generateObject({
        model,
        prompt: `Review this code:
    ${props.code}`,
        schema: z.object({
          riskLevel: z.enum(["low", "medium", "high"]),
          suggestions: z.array(z.string()),
          vulnerabilities: z.array(z.string()),
        }),
        system:
          "You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.",
      }),

      generateObject({
        model,
        prompt: `Review this code:
    ${props.code}`,
        schema: z.object({
          impact: z.enum(["low", "medium", "high"]),
          issues: z.array(z.string()),
          optimizations: z.array(z.string()),
        }),
        system:
          "You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.",
      }),

      generateObject({
        model,
        prompt: `Review this code:
    ${props.code}`,
        schema: z.object({
          concerns: z.array(z.string()),
          qualityScore: z.number().min(1).max(10),
          recommendations: z.array(z.string()),
        }),
        system:
          "You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.",
      }),
    ]);

  ctx.toast("Code reviews complete");

  const reviews = [
    { ...securityReview.object, type: "security" },
    { ...performanceReview.object, type: "performance" },
    { ...maintainabilityReview.object, type: "maintainability" },
  ];

  // Aggregate results using another model instance
  const { text: summary } = await generateText({
    model,
    prompt: `Synthesize these code review results into a concise summary with key actions:
  ${JSON.stringify(reviews, null, 2)}`,
    system: "You are a technical lead summarizing multiple code reviews.",
  });

  ctx.toast("Code review summary complete");

  return { reviews, summary };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { input?: { code?: string } };
    const { input } = body;

    if (!input?.code) {
      return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
    }

    const toastMessages: string[] = [];
    const toast = (message: string) => {
      toastMessages.push(message);
    };

    const result = await parallelWorkflow(
      { code: input.code },
      { toast, openai }
    );

    return NextResponse.json({
      success: true,
      result,
      messages: toastMessages,
    });
  } catch (error) {
    console.error("Parallel agent error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}