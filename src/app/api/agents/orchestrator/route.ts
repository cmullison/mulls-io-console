import { type OpenAIProvider, createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
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

type OrchestratorProps = { featureRequest: string };
type OrchestratorOutput = {
  plan: {
    files: { purpose: string; filePath: string; changeType: string }[];
    estimatedComplexity: string;
  };
  changes: {
    file: { purpose: string; filePath: string; changeType: string };
    implementation: {
      code: string;
      explanation: string;
    };
  }[];
};

async function orchestratorWorkflow(
  props: OrchestratorProps,
  ctx: { toast: (message: string) => void; openai: OpenAIProvider }
): Promise<OrchestratorOutput> {
  // This agent uses an orchestrator-workers workflow, suitable for complex tasks where subtasks aren't pre-defined.
  // It dynamically breaks down tasks and delegates them to worker LLMs, synthesizing their results.
  const { object: implementationPlan } = await generateObject({
    model: ctx.openai("o1"),
    prompt: `Analyze this feature request and create an implementation plan:
    ${props.featureRequest}`,
    schema: z.object({
      estimatedComplexity: z.enum(["low", "medium", "high"]),
      files: z.array(
        z.object({
          changeType: z.enum(["create", "modify", "delete"]),
          filePath: z.string(),
          purpose: z.string(),
        })
      ),
    }),
    system:
      "You are a senior software architect planning feature implementations.",
  });
  ctx.toast("Implementation plan created");
  
  // Workers: Execute the planned changes
  const fileChanges = await Promise.all(
    implementationPlan.files.map(async (file) => {
      // Each worker is specialized for the type of change
      const workerSystemPrompt = {
        create:
          "You are an expert at implementing new files following best practices and project patterns.",
        delete:
          "You are an expert at safely removing code while ensuring no breaking changes.",
        modify:
          "You are an expert at modifying existing code while maintaining consistency and avoiding regressions.",
      }[file.changeType];

      const { object: change } = await generateObject({
        model: ctx.openai("gpt-4o"),
        prompt: `Implement the changes for ${file.filePath} to support:
        ${file.purpose}

        Consider the overall feature context:
        ${props.featureRequest}`,
        schema: z.object({
          code: z.string(),
          explanation: z.string(),
        }),
        system: workerSystemPrompt,
      });
      ctx.toast("File change implemented");
      return {
        file,
        implementation: change,
      };
    })
  );

  ctx.toast("File changes implemented");
  return {
    changes: fileChanges,
    plan: implementationPlan,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { input?: { featureRequest?: string } };
    const { input } = body;

    if (!input?.featureRequest) {
      return NextResponse.json({ error: "Missing featureRequest parameter" }, { status: 400 });
    }

    const toastMessages: string[] = [];
    const toast = (message: string) => {
      toastMessages.push(message);
    };

    const result = await orchestratorWorkflow(
      { featureRequest: input.featureRequest },
      { toast, openai }
    );

    return NextResponse.json({
      success: true,
      result,
      messages: toastMessages,
    });
  } catch (error) {
    console.error("Orchestrator agent error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}