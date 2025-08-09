export const navigationAgentCode = `
import { Agent } from "agents";

export class NavigationAgent extends Agent {
  async *run() {
    const { prd, sectionRequirements, otherSections } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "🧭 Designing navigation structure..." } };

    // Step 1: Analyze Information Architecture
    const architecturePrompt = \`Design the navigation architecture based on:

    PRD Sections: \${JSON.stringify(prd.requirements.sections)}
    Other Sections: \${JSON.stringify(otherSections)}
    User Journey: \${JSON.stringify(prd.strategy.userJourney)}
    Business Goals: \${JSON.stringify(prd.goals)}

    Create navigation structure with:
    1. Primary navigation items (prioritized)
    2. Secondary/utility navigation
    3. Mobile menu structure
    4. Sticky behavior rules
    5. Scroll-based transformations
    6. Breadcrumb strategy (if applicable)

    Consider:
    - Information hierarchy
    - User mental models
    - Common navigation patterns for \${prd.product.description}
    - Conversion optimization

    Return as JSON.\`;

    const architectureResponse = await this.llm(architecturePrompt);
    const architecture = JSON.parse(architectureResponse);

    // Step 2: Generate Navigation Copy and Labels
    const copyPrompt = \`Create navigation copy and labels:

    Brand: \${JSON.stringify(prd.brand)}
    Architecture: \${JSON.stringify(architecture)}
    Tone: \${prd.requirements.style.tone}

    Generate:
    1. Navigation item labels
       - Clear, concise primary labels
       - Alternative labels for A/B testing
       - Mobile-specific labels (if different)
    2. Logo/brand text treatment
    3. Utility navigation labels (Login, Sign Up, etc.)
    4. Dropdown/submenu labels
    5. CTAs within navigation
    6. Accessibility labels (aria-labels)
    7. Tooltip/helper text

    Ensure labels are:
    - Action-oriented where appropriate
    - Consistent with brand voice
    - Optimized for scannability

    Return as JSON.\`;

    const copyResponse = await this.llm(copyPrompt);
    const copy = JSON.parse(copyResponse);

    // Step 3: Design Navigation Styles
    const stylePrompt = \`Design the navigation visual style:

    Design Style: \${prd.requirements.style.design}
    Colors: \${JSON.stringify(prd.requirements.style.colors)}
    Typography: \${JSON.stringify(prd.requirements.style.typography)}

    Define:
    1. Layout patterns
       - Desktop: horizontal, vertical, mega-menu, etc.
       - Mobile: hamburger, bottom nav, slide-out, etc.
       - Tablet: adaptive approach
    2. Visual styling
       - Background treatment (solid, transparent, blur)
       - Border and dividers
       - Shadow and elevation
       - Active state indicators
    3. Interactive states
       - Hover effects
       - Active/current page states
       - Focus states for accessibility
       - Transition animations
    4. Responsive behavior
       - Breakpoint transitions
       - Priority+ pattern implementation
       - Touch target sizes

    Return as JSON.\`;

    const styleResponse = await this.llm(stylePrompt);
    const styles = JSON.parse(styleResponse);

    // Step 4: Create Navigation CTAs
    const ctaPrompt = \`Design CTAs within the navigation:

    Conversion Strategy: \${JSON.stringify(prd.strategy.conversion)}
    Primary Goals: \${JSON.stringify(prd.goals.primary)}
    Navigation Structure: \${JSON.stringify(architecture)}

    Define:
    1. Primary navigation CTA
       - Placement strategy
       - Visual prominence
       - Text variations
       - Destination/action
    2. Utility CTAs (if applicable)
       - Sign up/Login placement
       - Free trial/Demo buttons
       - Contact/Support links
    3. Mobile-specific CTAs
       - Thumb-friendly placement
       - Simplified options
       - Progressive disclosure
    4. Sticky CTA behavior
       - When to show/hide
       - Transformation rules
       - Scroll triggers

    Return as JSON.\`;

    const ctaResponse = await this.llm(ctaPrompt);
    const ctas = JSON.parse(ctaResponse);

    // Step 5: Analytics and SEO Setup
    const analyticsPrompt = \`Configure analytics and SEO for navigation:

    Goals: \${JSON.stringify(prd.goals)}
    Navigation Items: \${JSON.stringify(architecture)}

    Provide:
    1. Event tracking
       - Click tracking for each item
       - Dropdown/submenu interactions
       - Mobile menu open/close
       - Search usage (if applicable)
    2. SEO optimization
       - Internal linking strategy
       - Anchor text optimization
       - Schema markup for SiteNavigationElement
       - Crawlability considerations
    3. Performance metrics
       - Time to interactive
       - First meaningful paint impact
       - Layout shift prevention
    4. User flow tracking
       - Navigation paths
       - Drop-off points
       - Popular routes

    Return as JSON.\`;

    const analyticsResponse = await this.llm(analyticsPrompt);
    const analytics = JSON.parse(analyticsResponse);

    // Final Navigation Section Compilation
    const navigationSection = {
      type: "navigation",
      structure: {
        architecture: architecture.primary,
        utility: architecture.utility,
        mobile: architecture.mobile,
        hierarchy: architecture.hierarchy,
        breadcrumbs: architecture.breadcrumbs
      },
      style: {
        layout: styles.layout,
        visual: styles.visual,
        states: styles.states,
        responsive: styles.responsive,
        animations: styles.animations
      },
      images: {
        logo: {
          requirements: "SVG preferred, PNG fallback",
          dimensions: { desktop: "180x40", mobile: "120x30" },
          variations: ["light", "dark", "compact"]
        },
        icons: {
          hamburger: "Custom or system",
          dropdown: "Chevron or arrow",
          external: "For external links"
        }
      },
      copy: {
        items: copy.items,
        utility: copy.utility,
        ctas: copy.ctas,
        accessibility: copy.accessibility,
        mobile: copy.mobile
      },
      ctas: {
        primary: ctas.primary,
        utility: ctas.utility,
        mobile: ctas.mobile,
        sticky: ctas.sticky
      },
      analytics: {
        events: analytics.events,
        goals: analytics.goals,
        flows: analytics.flows,
        seo: analytics.seo
      },
      seo: {
        schema: analytics.seo.schema,
        internalLinks: analytics.seo.internalLinks,
        anchorText: analytics.seo.anchorText
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        dependencies: ["hero"]
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(navigationSection, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: "Navigation section generated successfully!" } };
  }
}
`;