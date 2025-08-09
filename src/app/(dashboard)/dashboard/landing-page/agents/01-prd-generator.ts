export const prdGeneratorCode = `
import { Agent } from "agents";

export class PRDGenerator extends Agent {
  async *run() {
    const {
      businessName,
      productDescription,
      targetAudience,
      businessGoals,
      keyDifferentiators,
      competitors,
      tonePreferences,
      designPreferences
    } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };

    // Step 1: Analyze Business Context
    yield { type: "status", status: { isRunning: true, output: "🎯 Analyzing business context and market positioning..." } };

    const contextPrompt = \`Analyze this business and create a comprehensive Product Requirements Document (PRD) for a landing page:

    Business: \${businessName}
    Product/Service: \${productDescription}
    Target Audience: \${targetAudience}
    Business Goals: \${businessGoals}
    Key Differentiators: \${keyDifferentiators}
    Competitors: \${competitors}

    Create a structured PRD with:
    1. Brand identity (name, tagline, mission statement)
    2. Product analysis (core features, benefits, unique value propositions)
    3. Audience analysis (primary/secondary segments, pain points, motivations)
    4. Business objectives (primary goals, secondary goals, success metrics)
    5. Content requirements (essential sections, messaging hierarchy, tone guidelines)
    6. Design direction (style preferences, color psychology recommendations)
    7. Competitive positioning (how to differentiate from competitors)

    Format as JSON with clear structure.\`;

    const contextResponse = await this.llm(contextPrompt);
    const initialPRD = JSON.parse(contextResponse);

    yield { type: "status", status: { isRunning: true, output: JSON.stringify({ step: "initial_analysis", data: initialPRD }, null, 2) } };

    // Step 2: Enhance with Landing Page Specific Requirements
    yield { type: "status", status: { isRunning: true, output: "📋 Defining landing page specific requirements..." } };

    const landingPagePrompt = \`Based on this PRD: \${JSON.stringify(initialPRD)}

    Tone Preferences: \${tonePreferences}
    Design Preferences: \${designPreferences}

    Enhance the PRD with landing page specific requirements:
    1. Section Architecture
       - Recommended sections in priority order
       - Purpose and goal of each section
       - Content depth for each section

    2. Conversion Strategy
       - Primary conversion path
       - Secondary conversion opportunities
       - Trust signals and social proof placement
       - Urgency and scarcity tactics (if applicable)

    3. SEO & Technical Requirements
       - Target keywords
       - Meta description approach
       - Schema markup recommendations
       - Performance priorities

    4. User Journey Mapping
       - Entry points and user states
       - Information hierarchy
       - Call-to-action progression
       - Exit intent strategies

    Return enhanced PRD as JSON.\`;

    const enhancedResponse = await this.llm(landingPagePrompt);
    const enhancedPRD = JSON.parse(enhancedResponse);

    yield { type: "status", status: { isRunning: true, output: JSON.stringify({ step: "enhanced_requirements", data: enhancedPRD }, null, 2) } };

    // Step 3: Create Implementation Guidelines
    yield { type: "status", status: { isRunning: true, output: "🛠️ Creating implementation guidelines..." } };

    const implementationPrompt = \`Create detailed implementation guidelines for this landing page PRD:

    \${JSON.stringify(enhancedPRD)}

    Provide:
    1. Content Guidelines
       - Headline formulas for each section
       - Copy length recommendations
       - Keyword integration strategy
       - Microcopy standards

    2. Visual Guidelines
       - Image requirements and styles
       - Icon usage recommendations
       - Spacing and layout principles
       - Animation suggestions

    3. Interaction Guidelines
       - Form design principles
       - Button hierarchy
       - Hover states and micro-interactions
       - Mobile-specific considerations

    4. Testing Recommendations
       - A/B test priorities
       - Key metrics to track
       - User feedback collection points
       - Iteration strategy

    Return as JSON.\`;

    const implementationResponse = await this.llm(implementationPrompt);
    const implementationGuidelines = JSON.parse(implementationResponse);

    // Final PRD Compilation
    const finalPRD = {
      metadata: {
        businessName,
        generatedAt: new Date().toISOString(),
        version: "1.0"
      },
      brand: {
        name: enhancedPRD.brand.name,
        tagline: enhancedPRD.brand.tagline,
        mission: enhancedPRD.brand.mission,
        personality: enhancedPRD.brand.personality
      },
      product: {
        description: enhancedPRD.product.description,
        features: enhancedPRD.product.features,
        benefits: enhancedPRD.product.benefits,
        uniqueValueProps: enhancedPRD.product.uniqueValueProps
      },
      audience: {
        primary: enhancedPRD.audience.primary,
        secondary: enhancedPRD.audience.secondary,
        painPoints: enhancedPRD.audience.painPoints,
        motivations: enhancedPRD.audience.motivations
      },
      goals: {
        primary: enhancedPRD.goals.primary,
        secondary: enhancedPRD.goals.secondary,
        metrics: enhancedPRD.goals.metrics,
        kpis: enhancedPRD.goals.kpis
      },
      requirements: {
        sections: enhancedPRD.sectionArchitecture,
        style: {
          tone: tonePreferences,
          design: designPreferences,
          colors: enhancedPRD.designDirection.colorPalette,
          typography: enhancedPRD.designDirection.typography
        },
        content: enhancedPRD.contentRequirements,
        technical: enhancedPRD.technicalRequirements
      },
      strategy: {
        conversion: enhancedPRD.conversionStrategy,
        competitive: enhancedPRD.competitivePositioning,
        userJourney: enhancedPRD.userJourney
      },
      implementation: implementationGuidelines
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(finalPRD, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: "Product Requirements Document generated successfully!" } };
  }
}
`;