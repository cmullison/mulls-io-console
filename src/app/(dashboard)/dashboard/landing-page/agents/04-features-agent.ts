export const featuresAgentCode = `
import { Agent } from "agents";

export class FeaturesAgent extends Agent {
  async *run() {
    const { prd, sectionRequirements } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "⚡ Building features section..." } };

    // Step 1: Analyze and Prioritize Features
    const featureAnalysisPrompt = \`Analyze and prioritize features for the landing page:

    Product Features: \${JSON.stringify(prd.product.features)}
    Benefits: \${JSON.stringify(prd.product.benefits)}
    Unique Value Props: \${JSON.stringify(prd.product.uniqueValueProps)}
    Target Audience: \${JSON.stringify(prd.audience)}
    Competitors: \${prd.metadata.competitors || 'Not specified'}

    Create a features section strategy:
    1. Feature prioritization (which to highlight)
    2. Feature grouping/categorization
    3. Benefit-to-feature mapping
    4. Competitive differentiation angles
    5. Technical vs. benefit-focused balance
    6. Number of features to display (3, 6, 9, etc.)

    Consider the \${prd.audience.primary.description} audience's priorities.

    Return as JSON.\`;

    const analysisResponse = await this.llm(featureAnalysisPrompt);
    const featureStrategy = JSON.parse(analysisResponse);

    // Step 2: Generate Feature Structure and Layout
    const structurePrompt = \`Design the features section layout:

    Feature Strategy: \${JSON.stringify(featureStrategy)}
    Design Style: \${prd.requirements.style.design}
    Number of Features: \${featureStrategy.recommendedCount}

    Create layout options:
    1. Grid layouts (2x3, 3x2, 3x3)
    2. Card-based designs
    3. Alternating left/right layouts
    4. Timeline or process flows
    5. Tabbed or accordion layouts
    6. Comparison tables

    For each layout, define:
    - Visual hierarchy
    - Spacing and alignment
    - Responsive behavior
    - Animation opportunities
    - Reading patterns (Z, F, etc.)

    Return as JSON with multiple layout options.\`;

    const structureResponse = await this.llm(structurePrompt);
    const structure = JSON.parse(structureResponse);

    // Step 3: Generate Feature Copy
    const copyPrompt = \`Create compelling copy for each feature:

    Features: \${JSON.stringify(featureStrategy.prioritizedFeatures)}
    Tone: \${prd.requirements.style.tone}
    Audience Pain Points: \${JSON.stringify(prd.audience.painPoints)}

    For each feature, generate:
    1. Feature headline (benefit-focused)
       - Primary version
       - Alternative for A/B testing
    2. Description (2-3 sentences)
       - Benefit-first approach
       - Technical details (if needed)
       - Emotional connection
    3. Bullet points (if applicable)
    4. CTA text (Learn more, Try it, etc.)
    5. Social proof tie-in
    6. Icon/visual metaphor suggestion

    Ensure copy:
    - Addresses specific pain points
    - Uses active voice
    - Includes power words
    - Maintains consistent tone

    Return as JSON.\`;

    const copyResponse = await this.llm(copyPrompt);
    const copy = JSON.parse(copyResponse);

    // Step 4: Create Visual Elements
    const visualPrompt = \`Design visual elements for the features section:

    Features: \${JSON.stringify(copy)}
    Design Style: \${prd.requirements.style.design}
    Brand Colors: \${JSON.stringify(prd.requirements.style.colors)}

    Generate:
    1. Icon specifications for each feature
       - Style (line, filled, 3D, etc.)
       - Metaphor/representation
       - Color usage
       - Size recommendations
    2. Illustration prompts (if using illustrations)
       - Style consistency
       - Complexity level
       - Color palette
       - Composition
    3. Screenshot/demo requirements
       - What to highlight
       - Annotation strategy
       - Device frames
    4. Background elements
       - Patterns or gradients
       - Decorative elements
       - White space usage

    Return as JSON with detailed specifications.\`;

    const visualResponse = await this.llm(visualPrompt);
    const visuals = JSON.parse(visualResponse);

    // Step 5: Define Interactions and Analytics
    const interactionPrompt = \`Define interactions and analytics for features:

    Features Layout: \${JSON.stringify(structure.recommendedLayout)}
    Business Goals: \${JSON.stringify(prd.goals)}

    Specify:
    1. Interactive elements
       - Hover effects for cards
       - Click behaviors
       - Expand/collapse animations
       - Tab switching (if applicable)
       - Video demos triggers
    2. Progressive disclosure
       - What shows initially
       - "Show more" strategies
       - Detail levels
    3. Analytics events
       - Feature interest tracking
       - Engagement depth
       - CTA clicks per feature
       - Time spent per feature
    4. A/B test variations
       - Layout tests
       - Copy variations
       - Visual style tests
       - Number of features shown

    Return as JSON.\`;

    const interactionResponse = await this.llm(interactionPrompt);
    const interactions = JSON.parse(interactionResponse);

    // Final Features Section Compilation
    const featuresSection = {
      type: "features",
      structure: {
        layout: structure.recommendedLayout,
        alternativeLayouts: structure.alternatives,
        featureCount: featureStrategy.recommendedCount,
        grouping: featureStrategy.grouping,
        hierarchy: structure.hierarchy,
        responsive: structure.responsive
      },
      style: {
        theme: prd.requirements.style.design,
        cardStyle: structure.recommendedLayout.cardStyle,
        spacing: structure.recommendedLayout.spacing,
        borders: structure.recommendedLayout.borders,
        shadows: structure.recommendedLayout.shadows,
        animations: interactions.animations
      },
      images: {
        icons: visuals.icons,
        illustrations: visuals.illustrations,
        screenshots: visuals.screenshots,
        backgrounds: visuals.backgrounds,
        prompts: visuals.aiPrompts
      },
      copy: {
        sectionHeadline: copy.sectionHeadline,
        sectionSubheadline: copy.sectionSubheadline,
        features: copy.features,
        ctas: copy.featureCtas,
        microcopy: copy.microcopy
      },
      ctas: {
        sectionCta: interactions.sectionCta,
        featureCtas: interactions.featureCtas,
        placement: interactions.ctaPlacement
      },
      analytics: {
        events: interactions.analytics.events,
        goals: interactions.analytics.goals,
        heatmapZones: interactions.analytics.heatmapZones,
        abTests: interactions.analytics.abTests
      },
      seo: {
        headingStructure: "h2 for section, h3 for features",
        schema: {
          type: "ItemList",
          items: "Product features with descriptions"
        },
        keywordPlacement: copy.seoKeywords
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        dependencies: ["hero", "navigation"],
        featureStrategy: featureStrategy
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(featuresSection, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: "Features section generated successfully!" } };
  }
}
`;