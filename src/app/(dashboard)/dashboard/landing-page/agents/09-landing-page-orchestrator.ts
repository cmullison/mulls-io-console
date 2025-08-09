export const landingPageOrchestratorCode = `
import { Agent } from "agents";

export class LandingPageOrchestrator extends Agent {
  async *run() {
    const { prd, sectionsToGenerate, userId, teamId, landingPageName } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "🎼 Orchestrating landing page generation..." } };

    // Default sections if not specified
    const defaultSections = ['navigation', 'hero', 'features', 'testimonials', 'contact'];
    const requestedSections = sectionsToGenerate || defaultSections;

    // Step 1: Validate PRD
    yield { type: "status", status: { isRunning: true, output: "✅ Validating PRD completeness..." } };

    const prdValidation = this.validatePRD(prd);
    if (!prdValidation.isValid) {
      yield { type: "status", status: { isRunning: false, output: JSON.stringify({ error: "Invalid PRD", issues: prdValidation.issues }, null, 2) } };
      yield { type: "toast", toast: { type: "error", message: "PRD validation failed. Please complete all required fields." } };
      return;
    }

    // Step 2: Initialize Section Agents
    yield { type: "status", status: { isRunning: true, output: "🚀 Initializing section agents..." } };

    const agentMapping = {
      'hero': 'heroAgent',
      'navigation': 'navigationAgent',
      'features': 'featuresAgent',
      'testimonials': 'testimonialsAgent',
      'contact': 'contactAgent'
    };

    // Step 3: Generate Sections in Parallel
    yield { type: "status", status: { isRunning: true, output: "⚡ Generating sections in parallel..." } };

    const sectionPromises = requestedSections.map(async (sectionType) => {
      const agentName = agentMapping[sectionType];
      if (!agentName) {
        return { type: sectionType, error: "Unknown section type" };
      }

      try {
        // In a real implementation, this would call the actual Durable Object
        // For now, we'll simulate the agent response
        const agentResponse = await this.callSectionAgent(agentName, {
          prd,
          sectionRequirements: prd.requirements.sections.find(s => s.type === sectionType),
          otherSections: requestedSections.filter(s => s !== sectionType)
        });

        return agentResponse;
      } catch (error) {
        return { type: sectionType, error: error.message };
      }
    });

    const generatedSections = await Promise.all(sectionPromises);

    // Filter out any failed sections
    const successfulSections = generatedSections.filter(s => !s.error);
    const failedSections = generatedSections.filter(s => s.error);

    if (failedSections.length > 0) {
      yield { type: "status", status: {
        isRunning: true,
        output: JSON.stringify({
          warning: "Some sections failed to generate",
          failed: failedSections
        }, null, 2)
      }};
    }

    // Step 4: Run Architecture Review
    yield { type: "status", status: { isRunning: true, output: "🔍 Running architecture review..." } };

    const architectureReview = await this.callArchitectureReviewer({
      prd,
      sections: successfulSections
    });

    // Step 5: Apply Auto-fixes if Available
    if (architectureReview.optimizations?.autoFix?.length > 0) {
      yield { type: "status", status: { isRunning: true, output: "🔧 Applying automatic optimizations..." } };

      const optimizedSections = this.applyAutoFixes(
        successfulSections,
        architectureReview.optimizations.autoFix
      );

      // Use optimized sections if fixes were applied
      if (optimizedSections.length > 0) {
        successfulSections.splice(0, successfulSections.length, ...optimizedSections);
      }
    }

    // Step 6: Final Quality Check
    yield { type: "status", status: { isRunning: true, output: "✨ Performing final quality check..." } };

    const qualityCheck = await this.performQualityCheck({
      prd,
      sections: successfulSections,
      review: architectureReview
    });

    // Step 7: Package for Delivery
    yield { type: "status", status: { isRunning: true, output: "📦 Packaging final deliverables..." } };

    const deliveryPackage = await this.callDeliveryPackager({
      prd,
      sections: successfulSections,
      review: architectureReview,
      userId,
      teamId,
      landingPageName
    });

    // Final Orchestration Results
    const orchestrationResults = {
      success: true,
      summary: {
        sectionsRequested: requestedSections.length,
        sectionsGenerated: successfulSections.length,
        sectionsFailed: failedSections.length,
        architectureScore: architectureReview.summary?.overallScore || 0,
        qualityScore: qualityCheck.score,
        readyForImplementation: qualityCheck.passed
      },
      prd: prd,
      sections: successfulSections,
      review: architectureReview,
      quality: qualityCheck,
      delivery: deliveryPackage,
      issues: [
        ...failedSections.map(f => ({ type: 'generation', section: f.type, error: f.error })),
        ...architectureReview.reviews?.technical?.issues || [],
        ...qualityCheck.issues || []
      ],
      recommendations: {
        critical: architectureReview.optimizations?.critical || [],
        improvements: architectureReview.optimizations?.highPriority || [],
        abTests: architectureReview.optimizations?.abTests || []
      },
      metadata: {
        orchestratedAt: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        version: "2.0"
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(orchestrationResults, null, 2) } };
    yield { type: "toast", toast: {
      type: orchestrationResults.summary.qualityScore >= 7 ? "success" : "warning",
      message: \`Landing page orchestration complete! Generated \${successfulSections.length} sections with quality score: \${qualityCheck.score}/10\`
    } };
  }

  validatePRD(prd) {
    const issues = [];

    // Check required fields
    if (!prd.brand?.name) issues.push("Missing brand name");
    if (!prd.product?.description) issues.push("Missing product description");
    if (!prd.audience?.primary) issues.push("Missing primary audience");
    if (!prd.goals?.primary) issues.push("Missing primary goals");
    if (!prd.requirements?.sections) issues.push("Missing section requirements");

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  async callSectionAgent(agentName, input) {
    // Simulate agent call - in real implementation this would use WebSocket
    // to communicate with the actual Durable Object
    const mockResponse = {
      type: input.sectionRequirements?.type || agentName.replace('Agent', ''),
      structure: { layout: "default", components: [] },
      style: { theme: "modern", colors: {} },
      copy: { headlines: { primary: "Sample headline" }, body: {} },
      images: { prompts: [], placements: {} },
      ctas: { primary: { text: "Get Started" } },
      analytics: { events: [] },
      seo: { meta: {} },
      metadata: { generatedAt: new Date().toISOString() }
    };

    // Add small delay to simulate network call
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockResponse;
  }

  async callArchitectureReviewer(input) {
    // Simulate architecture review
    const mockReview = {
      summary: {
        overallScore: 8,
        status: "reviewed",
        sectionsReviewed: input.sections.length,
        criticalIssues: 0
      },
      reviews: {
        brand: { score: 8, consistency: "good", issues: [] },
        hierarchy: { score: 8, flow: "logical", issues: [] },
        technical: { score: 9, compatibility: "high", issues: [] },
        content: { score: 7, alignment: "good", gaps: [] }
      },
      optimizations: {
        critical: [],
        highPriority: [],
        autoFix: [],
        abTests: []
      },
      compatibility: {
        sectionsWork: true,
        brandAligned: true,
        techReady: true,
        contentComplete: true
      },
      metadata: {
        reviewedAt: new Date().toISOString(),
        reviewVersion: "1.0"
      }
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    return mockReview;
  }

  applyAutoFixes(sections, autoFixes) {
    // Apply automatic fixes to sections
    const fixedSections = [...sections];

    for (const fix of autoFixes) {
      const sectionIndex = fixedSections.findIndex(s => s.type === fix.section);
      if (sectionIndex !== -1) {
        // Apply fix (simplified for example)
        fixedSections[sectionIndex] = {
          ...fixedSections[sectionIndex],
          ...fix.changes
        };
      }
    }

    return fixedSections;
  }

  async performQualityCheck(input) {
    // Perform final quality checks
    const checks = {
      brandConsistency: this.checkBrandConsistency(input.sections),
      contentCompleteness: this.checkContentCompleteness(input.sections),
      technicalReadiness: this.checkTechnicalReadiness(input.sections),
      conversionOptimization: this.checkConversionOptimization(input.sections, input.prd)
    };

    const score = Object.values(checks).reduce((sum, check) => sum + check.score, 0) / Object.keys(checks).length;
    const issues = Object.values(checks).flatMap(check => check.issues);

    return {
      score: Math.round(score * 10) / 10,
      passed: score >= 7 && issues.filter(i => i.severity === 'critical').length === 0,
      checks,
      issues,
      recommendations: this.generateQualityRecommendations(checks)
    };
  }

  checkBrandConsistency(sections) {
    // Simplified brand consistency check
    return { score: 8, issues: [] };
  }

  checkContentCompleteness(sections) {
    // Simplified content completeness check
    return { score: 9, issues: [] };
  }

  checkTechnicalReadiness(sections) {
    // Simplified technical readiness check
    return { score: 9, issues: [] };
  }

  checkConversionOptimization(sections, prd) {
    // Simplified conversion optimization check
    return { score: 8, issues: [] };
  }

  generateQualityRecommendations(checks) {
    // Generate recommendations based on quality checks
    return [];
  }

  async callDeliveryPackager(input) {
    // Simulate delivery packaging
    const mockPackage = {
      summary: {
        name: input.landingPageName || "Landing Page",
        sections: input.sections.map(s => s.type),
        formats: ["json", "react", "html", "markdown"],
        readyForImplementation: true,
        estimatedBuildTime: "4-8 hours",
        architectureScore: input.review.summary.overallScore
      },
      sections: input.sections,
      exports: {
        json: { available: true },
        react: { available: true },
        html: { available: true },
        markdown: { available: true }
      },
      actions: {
        save: { enabled: true },
        export: { formats: ["json", "react", "html", "markdown", "zip"] },
        share: { enabled: true }
      },
      metadata: {
        packagedAt: new Date().toISOString(),
        version: "1.0"
      }
    };

    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPackage;
  }

  constructor(state, env) {
    super(state, env);
    this.startTime = Date.now();
  }
}
`;