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

// Landing Page Agents
export const SequentialBuilder = createAgent(
  "SequentialBuilder",
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");
    const { productName, targetAudience, primaryGoal, industry } = props;
    
    ctx.toast("Creating hero section...");
    const { object: heroData } = await generateObject({
      model,
      prompt: `Create a high-converting hero section for "${productName}" targeting ${targetAudience}. 
      Primary goal: ${primaryGoal}. Industry: ${industry}.`,
      schema: z.object({
        headline: z.string(),
        subheadline: z.string(),
        valueProps: z.array(z.string()),
        ctaText: z.string(),
        imagePrompt: z.string(),
      }),
    });

    ctx.toast("Building features section...");
    const { object: featuresData } = await generateObject({
      model,
      prompt: `Based on hero: ${JSON.stringify(heroData)}, create features section for "${productName}".`,
      schema: z.object({
        sectionHeadline: z.string(),
        features: z.array(z.object({
          title: z.string(),
          description: z.string(),
          icon: z.string(),
        })),
        imagePrompt: z.string(),
      }),
    });

    ctx.toast("Creating social proof...");
    const { object: socialProofData } = await generateObject({
      model,
      prompt: `Create social proof section for "${productName}" targeting ${targetAudience}.`,
      schema: z.object({
        sectionHeadline: z.string(),
        testimonials: z.array(z.object({
          quote: z.string(),
          name: z.string(),
          title: z.string(),
          company: z.string(),
        })),
        stats: z.array(z.object({
          number: z.string(),
          label: z.string(),
        })),
        logosPrompt: z.string(),
      }),
    });

    ctx.toast("Finalizing CTA section...");
    const { object: ctaData } = await generateObject({
      model,
      prompt: `Create final CTA section for "${productName}" with goal: ${primaryGoal}.`,
      schema: z.object({
        headline: z.string(),
        benefits: z.array(z.string()),
        primaryCta: z.string(),
        secondaryCta: z.string(),
        trustSignals: z.array(z.string()),
      }),
    });

    ctx.toast("Landing page sections complete!");
    return {
      hero: heroData,
      features: featuresData,
      socialProof: socialProofData,
      cta: ctaData,
      metadata: { productName, targetAudience, primaryGoal, industry }
    };
  }
);

export const ParallelSections = createAgent(
  "ParallelSections",
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");
    const { brandName, productDetails, targetMarket, tone, designStyle } = props;
    
    ctx.toast("Generating sections in parallel...");
    
    const [heroData, aboutData, benefitsData, faqData] = await Promise.all([
      generateObject({
        model,
        prompt: `Create hero section for "${brandName}". Details: ${productDetails}. Target: ${targetMarket}. Tone: ${tone}.`,
        schema: z.object({
          headline: z.string(),
          subheadline: z.string(),
          valueProps: z.array(z.string()),
          ctaText: z.string(),
          imagePrompt: z.string(),
        }),
      }),
      generateObject({
        model,
        prompt: `Create about section for "${brandName}". Details: ${productDetails}. Tone: ${tone}.`,
        schema: z.object({
          sectionHeadline: z.string(),
          story: z.string(),
          mission: z.string(),
          teamImagePrompt: z.string(),
        }),
      }),
      generateObject({
        model,
        prompt: `Create benefits section for "${brandName}". Details: ${productDetails}. Target: ${targetMarket}.`,
        schema: z.object({
          sectionHeadline: z.string(),
          benefits: z.array(z.object({
            title: z.string(),
            description: z.string(),
            icon: z.string(),
          })),
          imagePrompt: z.string(),
        }),
      }),
      generateObject({
        model,
        prompt: `Create FAQ section for "${brandName}" addressing common objections. Target: ${targetMarket}.`,
        schema: z.object({
          sectionHeadline: z.string(),
          faqs: z.array(z.object({
            question: z.string(),
            answer: z.string(),
          })),
        }),
      }),
    ]);

    ctx.toast("Ensuring brand consistency...");
    const { object: consistencyData } = await generateObject({
      model,
      prompt: `Review sections for brand consistency. Brand: ${brandName}, Tone: ${tone}, Target: ${targetMarket}`,
      schema: z.object({
        consistencyScore: z.number().min(1).max(10),
        suggestions: z.array(z.string()),
      }),
    });

    ctx.toast("Parallel generation complete!");
    return {
      hero: heroData.object,
      about: aboutData.object,
      benefits: benefitsData.object,
      faq: faqData.object,
      consistency: consistencyData,
      metadata: { brandName, targetMarket, tone, designStyle }
    };
  }
);

export const OrchestratorCreator = createAgent(
  "OrchestratorCreator",
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");
    const { productName, productDescription, targetAudience, businessGoals } = props;
    
    ctx.toast("Creating strategy...");
    const { object: strategy } = await generateObject({
      model,
      prompt: `Create landing page strategy for "${productName}": ${productDescription}. Target: ${targetAudience}. Goals: ${businessGoals}.`,
      schema: z.object({
        pageStructure: z.array(z.string()),
        messagingHierarchy: z.object({
          primary: z.string(),
          secondary: z.string(),
        }),
        conversionStrategy: z.array(z.string()),
      }),
    });

    ctx.toast("Delegating content creation...");
    const [heroSection, featuresSection, ctaSection] = await Promise.all([
      generateObject({
        model,
        prompt: `Create hero section based on strategy: ${JSON.stringify(strategy)}. Product: ${productName}`,
        schema: z.object({
          headline: z.string(),
          subheadline: z.string(),
          valueProps: z.array(z.string()),
          primaryCTA: z.string(),
          heroImagePrompt: z.string(),
        }),
      }),
      generateObject({
        model,
        prompt: `Create features section for ${productName}: ${productDescription}`,
        schema: z.object({
          sectionHeadline: z.string(),
          features: z.array(z.object({
            title: z.string(),
            description: z.string(),
            benefit: z.string(),
            icon: z.string(),
          })),
          imagePrompt: z.string(),
        }),
      }),
      generateObject({
        model,
        prompt: `Create CTA section based on goals: ${businessGoals}`,
        schema: z.object({
          headline: z.string(),
          benefits: z.array(z.string()),
          primaryCTA: z.string(),
          trustSignals: z.array(z.string()),
        }),
      }),
    ]);

    ctx.toast("Creating design guidelines...");
    const { object: designGuidelines } = await generateObject({
      model,
      prompt: `Create design guidelines for landing page. Product: ${productName}, Target: ${targetAudience}`,
      schema: z.object({
        colorPalette: z.object({
          primary: z.string(),
          secondary: z.string(),
          accent: z.string(),
        }),
        typography: z.object({
          headingFont: z.string(),
          bodyFont: z.string(),
        }),
        imagery: z.array(z.string()),
      }),
    });

    ctx.toast("Complete page created!");
    return {
      strategy,
      sections: {
        hero: heroSection.object,
        features: featuresSection.object,
        cta: ctaSection.object,
      },
      designGuidelines,
      metadata: { productName, targetAudience, businessGoals }
    };
  }
);

export const EvaluatorOptimizer = createAgent(
  "EvaluatorOptimizer",
  async (props, ctx) => {
    const model = ctx.openai("gpt-4o");
    const { existingCopy, sectionType, optimizationGoals, targetAudience } = props;
    
    let currentCopy = JSON.parse(existingCopy);
    let bestScore = 0;
    let bestVersion = currentCopy;
    
    for (let iteration = 1; iteration <= 3; iteration++) {
      ctx.toast(`Iteration ${iteration}: Optimizing copy...`);
      
      const { text: improvedCopy } = await generateText({
        model,
        prompt: `Optimize this ${sectionType} copy for: ${optimizationGoals}. 
        Current: ${JSON.stringify(currentCopy)}. Target: ${targetAudience}`,
        system: "You are a conversion copywriting expert.",
      });

      ctx.toast(`Iteration ${iteration}: Evaluating...`);
      const { object: evaluation } = await generateObject({
        model,
        prompt: `Rate this copy improvement on conversion potential (1-100): ${improvedCopy}`,
        schema: z.object({
          overallScore: z.number().min(1).max(100),
          improvements: z.array(z.string()),
          strengths: z.array(z.string()),
          weaknesses: z.array(z.string()),
        }),
      });

      if (evaluation.overallScore > bestScore) {
        bestScore = evaluation.overallScore;
        bestVersion = improvedCopy;
      }

      if (evaluation.overallScore >= 85) break;
      currentCopy = JSON.parse(improvedCopy);
    }

    ctx.toast("Creating A/B test variations...");
    const { object: abTestVariations } = await generateObject({
      model,
      prompt: `Create 3 A/B test variations of: ${bestVersion}`,
      schema: z.object({
        variationA: z.string(),
        variationB: z.string(), 
        variationC: z.string(),
        testHypotheses: z.array(z.string()),
      }),
    });

    ctx.toast(`Optimization complete! Final score: ${bestScore}/100`);
    return {
      originalCopy: JSON.parse(existingCopy),
      optimizedCopy: bestVersion,
      finalScore: bestScore,
      abTesting: abTestVariations,
      metadata: { sectionType, optimizationGoals, targetAudience }
    };
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