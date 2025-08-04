export const orchestratorCreatorCode = `
import { Agent } from "agents";

export class OrchestratorCompletePageCreator extends Agent {
  async *run() {
    const { 
      productName, 
      productDescription, 
      targetAudience, 
      businessGoals, 
      competitors, 
      brandGuidelines,
      contentRequirements 
    } = this.input;
    
    yield { type: "status", status: { isRunning: true, output: "" } };
    
    // Step 1: Strategic Planning
    yield { type: "status", status: { isRunning: true, output: "🎯 Analyzing requirements and creating strategy..." } };
    
    const strategyPrompt = \`As a landing page strategist, analyze this project and create a comprehensive strategy:
    
    Product: \${productName}
    Description: \${productDescription}
    Target Audience: \${targetAudience}
    Business Goals: \${businessGoals}
    Competitors: \${competitors}
    Brand Guidelines: \${brandGuidelines}
    Content Requirements: \${contentRequirements}
    
    Return JSON with:
    - pageStructure: ordered array of sections to include
    - messagingHierarchy: primary, secondary messages
    - conversionStrategy: key conversion points and tactics
    - designDirection: visual approach and style recommendations
    - contentPriorities: what to emphasize in each section\`;
    
    const strategyResponse = await this.llm(strategyPrompt);
    const strategy = JSON.parse(strategyResponse);
    
    yield { type: "status", status: { isRunning: true, output: JSON.stringify({ phase: "strategy", data: strategy }, null, 2) } };
    
    // Step 2: Delegate Content Creation to Specialized Workers
    yield { type: "status", status: { isRunning: true, output: "👥 Delegating section creation to specialized workers..." } };
    
    const sectionPromises = strategy.pageStructure.map(async (section) => {
      switch (section.toLowerCase()) {
        case 'hero':
          return await this.createHeroSection(strategy, productName, productDescription, targetAudience);
        case 'features':
        case 'benefits':
          return await this.createFeaturesSection(strategy, productName, productDescription);
        case 'social proof':
        case 'testimonials':
          return await this.createSocialProofSection(strategy, productName, targetAudience);
        case 'about':
        case 'story':
          return await this.createAboutSection(strategy, productName, productDescription, brandGuidelines);
        case 'pricing':
          return await this.createPricingSection(strategy, productName, businessGoals);
        case 'faq':
          return await this.createFAQSection(strategy, productName, targetAudience);
        case 'cta':
        case 'contact':
          return await this.createCTASection(strategy, businessGoals);
        default:
          return await this.createCustomSection(section, strategy, productName);
      }
    });
    
    const sectionResults = await Promise.all(sectionPromises);
    
    // Step 3: Content Integration and Optimization
    yield { type: "status", status: { isRunning: true, output: "🔧 Integrating sections and optimizing flow..." } };
    
    const integrationPrompt = \`Review and optimize this complete landing page for flow and conversion:
    
    Strategy: \${JSON.stringify(strategy)}
    Sections: \${JSON.stringify(sectionResults)}
    
    Return JSON with:
    - optimizedSections: refined content with better transitions
    - conversionOptimizations: specific improvements for higher conversion
    - contentGaps: any missing elements
    - abTestSuggestions: elements to test for optimization\`;
    
    const integrationResponse = await this.llm(integrationPrompt);
    const integration = JSON.parse(integrationResponse);
    
    // Step 4: Final Assembly and Design Guidelines
    yield { type: "status", status: { isRunning: true, output: "🎨 Creating design guidelines and final assembly..." } };
    
    const designPrompt = \`Create comprehensive design guidelines for this landing page:
    
    Brand Guidelines: \${brandGuidelines}
    Strategy: \${JSON.stringify(strategy)}
    Content: \${JSON.stringify(integration.optimizedSections)}
    
    Return JSON with:
    - colorPalette: primary, secondary, accent colors with hex codes
    - typography: heading and body font recommendations
    - spacing: layout spacing guidelines
    - imagery: specific image requirements and prompts for each section
    - animations: subtle animation suggestions for engagement
    - responsive: mobile-first design considerations\`;
    
    const designResponse = await this.llm(designPrompt);
    const designGuidelines = JSON.parse(designResponse);
    
    // Final Compilation
    const completeLandingPage = {
      metadata: {
        productName,
        targetAudience,
        businessGoals,
        generatedAt: new Date().toISOString(),
        strategy: strategy
      },
      sections: integration.optimizedSections,
      designGuidelines,
      optimization: {
        conversionTactics: integration.conversionOptimizations,
        abTestSuggestions: integration.abTestSuggestions,
        contentGaps: integration.contentGaps
      },
      implementation: {
        techStack: "Next.js + Tailwind CSS",
        deploymentNotes: "Optimized for Core Web Vitals",
        analyticsSetup: "Conversion tracking recommended"
      }
    };
    
    yield { type: "status", status: { isRunning: false, output: JSON.stringify(completeLandingPage, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: \`Complete landing page created with \${sectionResults.length} sections and full design guidelines!\` } };
  }
  
  async createHeroSection(strategy, productName, productDescription, targetAudience) {
    const prompt = \`Create a high-impact hero section for "\${productName}":
    Description: \${productDescription}
    Target: \${targetAudience}
    Strategy: \${JSON.stringify(strategy.messagingHierarchy)}
    
    Include: headline, subheadline, valueProps, primaryCTA, secondaryCTA, heroImagePrompt
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: 'hero', content: JSON.parse(response) };
  }
  
  async createFeaturesSection(strategy, productName, productDescription) {
    const prompt = \`Create features section for "\${productName}":
    Description: \${productDescription}
    Strategy: \${JSON.stringify(strategy.contentPriorities)}
    
    Include: sectionHeadline, features (array with title, description, benefit, icon), imagePrompt
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: 'features', content: JSON.parse(response) };
  }
  
  async createSocialProofSection(strategy, productName, targetAudience) {
    const prompt = \`Create social proof section for "\${productName}":
    Target: \${targetAudience}
    Strategy: \${JSON.stringify(strategy.conversionStrategy)}
    
    Include: sectionHeadline, testimonials, stats, logos, trustBadges
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: 'socialProof', content: JSON.parse(response) };
  }
  
  async createAboutSection(strategy, productName, productDescription, brandGuidelines) {
    const prompt = \`Create about section for "\${productName}":
    Description: \${productDescription}
    Brand: \${brandGuidelines}
    Strategy: \${JSON.stringify(strategy.messagingHierarchy)}
    
    Include: sectionHeadline, story, mission, team, imagePrompts
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: 'about', content: JSON.parse(response) };
  }
  
  async createPricingSection(strategy, productName, businessGoals) {
    const prompt = \`Create pricing section for "\${productName}":
    Goals: \${businessGoals}
    Strategy: \${JSON.stringify(strategy.conversionStrategy)}
    
    Include: sectionHeadline, plans, features, ctaText, guarantees
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: 'pricing', content: JSON.parse(response) };
  }
  
  async createFAQSection(strategy, productName, targetAudience) {
    const prompt = \`Create FAQ section for "\${productName}":
    Target: \${targetAudience}
    Strategy: Address objections from \${JSON.stringify(strategy.conversionStrategy)}
    
    Include: sectionHeadline, faqs (array with question, answer)
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: 'faq', content: JSON.parse(response) };
  }
  
  async createCTASection(strategy, businessGoals) {
    const prompt = \`Create final CTA section:
    Goals: \${businessGoals}
    Strategy: \${JSON.stringify(strategy.conversionStrategy)}
    
    Include: headline, urgency, benefits, primaryCTA, trustSignals
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: 'cta', content: JSON.parse(response) };
  }
  
  async createCustomSection(sectionType, strategy, productName) {
    const prompt = \`Create a \${sectionType} section for "\${productName}":
    Strategy: \${JSON.stringify(strategy)}
    
    Include relevant content for this section type.
    Return JSON only.\`;
    
    const response = await this.llm(prompt);
    return { type: sectionType, content: JSON.parse(response) };
  }
}
`;