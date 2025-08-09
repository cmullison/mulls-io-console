export const heroAgentCode = `
import { Agent } from "agents";

export class HeroAgent extends Agent {
  async *run() {
    const { prd, sectionRequirements } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "🎨 Crafting hero section components..." } };

    // Step 1: Generate Hero Structure and Layout
    const structurePrompt = \`Design the hero section structure based on this PRD:

    Brand: \${JSON.stringify(prd.brand)}
    Product: \${JSON.stringify(prd.product)}
    Audience: \${JSON.stringify(prd.audience)}
    Goals: \${JSON.stringify(prd.goals)}
    Style Requirements: \${JSON.stringify(prd.requirements.style)}

    Create a hero section structure with:
    1. Layout pattern (split, centered, offset, etc.)
    2. Component hierarchy (what comes first, second, etc.)
    3. Visual weight distribution
    4. Responsive behavior rules
    5. Animation entry points

    Return as JSON with detailed specifications.\`;

    const structureResponse = await this.llm(structurePrompt);
    const structure = JSON.parse(structureResponse);

    // Step 2: Generate Hero Copy
    const copyPrompt = \`Create compelling hero section copy based on:

    PRD: \${JSON.stringify(prd)}
    Structure: \${JSON.stringify(structure)}

    Generate:
    1. Primary headline (multiple variations for A/B testing)
       - Maximum impact version
       - Benefit-focused version
       - Problem-solving version
    2. Supporting subheadline options
    3. Value proposition bullets (3-5)
    4. Primary CTA text variations
    5. Secondary CTA text (if applicable)
    6. Trust signals or badges text
    7. Microcopy (form labels, tooltips, etc.)

    Ensure copy aligns with tone: \${prd.requirements.style.tone}

    Return as JSON.\`;

    const copyResponse = await this.llm(copyPrompt);
    const copy = JSON.parse(copyResponse);

    // Step 3: Generate Image Prompts
    const imagePrompt = \`Create detailed image generation prompts for hero section visuals:

    Brand: \${JSON.stringify(prd.brand)}
    Product: \${JSON.stringify(prd.product)}
    Design Style: \${prd.requirements.style.design}
    Structure: \${JSON.stringify(structure)}

    Generate prompts for:
    1. Main hero image/illustration
       - Style and mood
       - Composition details
       - Color palette alignment
       - Subject matter
    2. Background patterns or textures
    3. Icon set for features/benefits
    4. Any supplementary visuals

    Include negative prompts to avoid unwanted elements.
    Format for AI image generation tools.

    Return as JSON.\`;

    const imageResponse = await this.llm(imagePrompt);
    const images = JSON.parse(imageResponse);

    // Step 4: Define CTAs and Interactions
    const ctaPrompt = \`Design the call-to-action strategy for the hero section:

    Goals: \${JSON.stringify(prd.goals)}
    Conversion Strategy: \${JSON.stringify(prd.strategy.conversion)}
    Copy: \${JSON.stringify(copy)}

    Define:
    1. Primary CTA
       - Button text options
       - Destination/action
       - Style (color, size, position)
       - Hover/active states
    2. Secondary CTA (if applicable)
       - Text options
       - Style differentiation
       - Placement strategy
    3. Form integration (if needed)
       - Fields required
       - Progressive disclosure strategy
       - Validation approach
    4. Interaction patterns
       - Micro-animations
       - Loading states
       - Success feedback

    Return as JSON.\`;

    const ctaResponse = await this.llm(ctaPrompt);
    const ctas = JSON.parse(ctaResponse);

    // Step 5: Analytics and SEO Configuration
    const analyticsPrompt = \`Configure analytics and SEO for the hero section:

    Business Goals: \${JSON.stringify(prd.goals)}
    Technical Requirements: \${JSON.stringify(prd.requirements.technical)}

    Provide:
    1. Event tracking setup
       - Click events to track
       - Scroll depth markers
       - Engagement metrics
       - Custom dimensions
    2. SEO optimization
       - H1 tag strategy
       - Schema markup for hero
       - Meta description influence
       - Core Web Vitals considerations
    3. A/B test configuration
       - Test variants to track
       - Success metrics
       - Sample size recommendations
    4. Conversion tracking
       - Goal definitions
       - Funnel steps
       - Attribution model

    Return as JSON.\`;

    const analyticsResponse = await this.llm(analyticsPrompt);
    const analytics = JSON.parse(analyticsResponse);

    // Final Hero Section Compilation
    const heroSection = {
      type: "hero",
      structure: {
        layout: structure.layout,
        components: structure.components,
        hierarchy: structure.hierarchy,
        responsive: structure.responsive,
        animations: structure.animations
      },
      style: {
        theme: prd.requirements.style.design,
        colors: {
          primary: prd.requirements.style.colors?.primary || "#000000",
          secondary: prd.requirements.style.colors?.secondary || "#ffffff",
          accent: prd.requirements.style.colors?.accent || "#0066cc"
        },
        typography: prd.requirements.style.typography,
        spacing: structure.spacing
      },
      images: {
        prompts: images.prompts,
        placements: images.placements,
        alternativeText: images.altText,
        sources: images.sources
      },
      copy: {
        headlines: copy.headlines,
        subheadlines: copy.subheadlines,
        valueProps: copy.valueProps,
        body: copy.body,
        microcopy: copy.microcopy,
        variations: copy.variations
      },
      ctas: {
        primary: ctas.primary,
        secondary: ctas.secondary,
        forms: ctas.forms,
        interactions: ctas.interactions
      },
      analytics: {
        events: analytics.events,
        goals: analytics.goals,
        tags: analytics.tags,
        tests: analytics.tests
      },
      seo: {
        h1Strategy: analytics.seo.h1Strategy,
        schema: analytics.seo.schema,
        meta: analytics.seo.meta
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        dependencies: []
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(heroSection, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: "Hero section generated successfully!" } };
  }
}
`;