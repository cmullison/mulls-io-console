// Import the agents package and re-create the agent classes
import { Agent, routeAgentRequest } from "agents";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";

// Import the OpenNext worker
import openNextWorker from "./.open-next/worker.js";

// Re-export all OpenNext exports (like DOQueueHandler, etc.)
export * from "./.open-next/worker.js";

// Simple agent base class that extends the Cloudflare Agents SDK
function createAgent(name, workflow) {
  return class extends Agent {
    static options = {
      hibernate: true,
    };

    status = {
      isRunning: false,
      output: undefined,
    };

    onConnect(connection) {
      connection.send(
        JSON.stringify({
          status: this.status,
          type: "status",
        })
      );
    }

    toast = (message, type = "info") => {
      this.broadcast(
        JSON.stringify({
          toast: { message, type },
          type: "toast",
        })
      );
    };

    onMessage(_connection, message) {
      const data = JSON.parse(message);
      switch (data.type) {
        case "run":
          this.run({ input: data.input });
          break;
        case "stop":
          this.setStatus({ ...this.status, isRunning: false });
          break;
        default:
          console.error("Unknown message type", data.type);
      }
    }

    setStatus(status) {
      this.status = status;
      this.broadcast(JSON.stringify({ status: this.status, type: "status" }));
    }

    async run(data) {
      if (this.status.isRunning) return;
      this.setStatus({ isRunning: true, output: undefined });

      try {
        const openai = createOpenAI({
          apiKey: this.env.OPENAI_API_KEY,
          baseURL: `https://gateway.ai.cloudflare.com/v1/${this.env.AI_GATEWAY_ACCOUNT_ID}/${this.env.AI_GATEWAY_ID}/openai`,
          headers: {
            "cf-aig-authorization": `Bearer ${this.env.AI_GATEWAY_TOKEN}`,
          },
        });

        const result = await workflow(data.input, {
          openai,
          toast: this.toast,
        });
        this.setStatus({ isRunning: false, output: JSON.stringify(result) });
      } catch (error) {
        this.toast(`An error occurred: ${error}`);
        this.setStatus({ isRunning: false, output: JSON.stringify(error) });
      }
    }
  };
}

// Define the agent workflows
export const Sequential = createAgent(
  "Sequential",
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");
    
    const { text: copy } = await generateText({
      model,
      prompt: `Write persuasive marketing copy for: ${props.input}. 

Format your response in markdown with:
- **Bold** for key benefits and important points
- *Italics* for emotional phrases
- Bullet points for features
- Clear structure with headers if needed

Focus on benefits and emotional appeal.`,
    });
    ctx.toast("Copy generated");

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

    if (
      !qualityMetrics.hasCallToAction ||
      qualityMetrics.emotionalAppeal < 7 ||
      qualityMetrics.clarity < 7
    ) {
      const { text: improvedCopy } = await generateText({
        model,
        prompt: `Rewrite this marketing copy with improvements based on quality metrics.
        Original copy: ${copy}`,
      });
      ctx.toast("Copy improved");
      return { copy: improvedCopy, qualityMetrics };
    }

    return { copy, qualityMetrics };
  }
);

export const Routing = createAgent(
  "Routing", 
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");

    const { object: classification } = await generateObject({
      model,
      prompt: `Classify this customer query: ${props.query}`,
      schema: z.object({
        complexity: z.enum(["simple", "complex"]),
        reasoning: z.string(),
        type: z.enum(["general", "refund", "technical"]),
      }),
    });
    ctx.toast("Query classified");

    const { text: response } = await generateText({
      model: classification.complexity === "simple" ? ctx.openai("gpt-4o-mini") : ctx.openai("o1-mini"),
      prompt: props.query,
      system: {
        general: "You are an expert customer service agent handling general inquiries.",
        refund: "You are a customer service agent specializing in refund requests.",
        technical: "You are a technical support specialist with deep product knowledge.",
      }[classification.type],
    });
    ctx.toast("Response generated");
    
    return { classification, response };
  }
);

export const Parallel = createAgent(
  "Parallel",
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");

    const [securityReview, performanceReview, maintainabilityReview] = await Promise.all([
      generateObject({
        model,
        prompt: `Review this code for security: ${props.code}`,
        schema: z.object({
          riskLevel: z.enum(["low", "medium", "high"]),
          suggestions: z.array(z.string()),
          vulnerabilities: z.array(z.string()),
        }),
        system: "You are an expert in code security.",
      }),
      generateObject({
        model,
        prompt: `Review this code for performance: ${props.code}`,
        schema: z.object({
          impact: z.enum(["low", "medium", "high"]),
          issues: z.array(z.string()),
          optimizations: z.array(z.string()),
        }),
        system: "You are an expert in code performance.",
      }),
      generateObject({
        model,
        prompt: `Review this code for maintainability: ${props.code}`,
        schema: z.object({
          concerns: z.array(z.string()),
          qualityScore: z.number().min(1).max(10),
          recommendations: z.array(z.string()),
        }),
        system: "You are an expert in code quality.",
      }),
    ]);

    ctx.toast("Code reviews complete");

    const reviews = [
      { ...securityReview.object, type: "security" },
      { ...performanceReview.object, type: "performance" },
      { ...maintainabilityReview.object, type: "maintainability" },
    ];

    const { text: summary } = await generateText({
      model,
      prompt: `Synthesize these code review results: ${JSON.stringify(reviews)}`,
      system: "You are a technical lead summarizing code reviews.",
    });

    ctx.toast("Code review summary complete");
    return { reviews, summary };
  }
);

export const Orchestrator = createAgent(
  "Orchestrator",
  async (props, ctx) => {
    const { object: implementationPlan } = await generateObject({
      model: ctx.openai("o1"),
      prompt: `Create implementation plan for: ${props.featureRequest}`,
      schema: z.object({
        estimatedComplexity: z.enum(["low", "medium", "high"]),
        files: z.array(z.object({
          changeType: z.enum(["create", "modify", "delete"]),
          filePath: z.string(),
          purpose: z.string(),
        })),
      }),
      system: "You are a senior software architect.",
    });
    ctx.toast("Implementation plan created");

    const fileChanges = await Promise.all(
      implementationPlan.files.map(async (file) => {
        const { object: change } = await generateObject({
          model: ctx.openai("gpt-4o"),
          prompt: `Implement changes for ${file.filePath}: ${file.purpose}`,
          schema: z.object({
            code: z.string(),
            explanation: z.string(),
          }),
          system: "You are an expert developer.",
        });
        ctx.toast("File change implemented");
        return { file, implementation: change };
      })
    );

    ctx.toast("File changes implemented");
    return { changes: fileChanges, plan: implementationPlan };
  }
);

export const Evaluator = createAgent(
  "Evaluator",
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");

    const { text: translation } = await generateText({
      model: ctx.openai("gpt-4o-mini"),
      prompt: `Translate to ${props.targetLanguage}: ${props.text}`,
      system: "You are an expert literary translator.",
    });
    ctx.toast("Initial translation complete");

    const { object: evaluation } = await generateObject({
      model,
      prompt: `Evaluate this translation quality:
      Original: ${props.text}
      Translation: ${translation}`,
      schema: z.object({
        culturallyAccurate: z.boolean(),
        improvementSuggestions: z.array(z.string()),
        preservesNuance: z.boolean(),
        preservesTone: z.boolean(),
        qualityScore: z.number().min(1).max(10),
        specificIssues: z.array(z.string()),
      }),
      system: "You are an expert in evaluating translations.",
    });

    ctx.toast(`Evaluation complete: ${evaluation.qualityScore}`);

    if (evaluation.qualityScore < 8 || !evaluation.preservesTone || !evaluation.preservesNuance || !evaluation.culturallyAccurate) {
      const { text: improvedTranslation } = await generateText({
        model,
        prompt: `Improve translation based on feedback:
        Issues: ${evaluation.specificIssues.join(", ")}
        Suggestions: ${evaluation.improvementSuggestions.join(", ")}
        Original: ${props.text}
        Current: ${translation}`,
        system: "You are an expert literary translator.",
      });
      ctx.toast("Improved translation complete");
      return { finalTranslation: improvedTranslation, iterationsRequired: 1 };
    }

    ctx.toast("Final translation complete");
    return { finalTranslation: translation, iterationsRequired: 0 };
  }
);

// Export the default handler that routes between agents and OpenNext
export default {
  async fetch(request, env, ctx) {
    // First try to route agent requests
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) {
      return agentResponse;
    }
    
    // Otherwise, fall back to OpenNext worker
    return openNextWorker.fetch(request, env, ctx);
  }
};