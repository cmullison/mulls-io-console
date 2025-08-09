export const testimonialsAgentCode = `
import { Agent } from "agents";

export class TestimonialsAgent extends Agent {
  async *run() {
    const { prd, sectionRequirements } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "🏆 Creating social proof section..." } };

    // Step 1: Define Social Proof Strategy
    const strategyPrompt = \`Create a social proof strategy for:

    Product: \${JSON.stringify(prd.product)}
    Target Audience: \${JSON.stringify(prd.audience)}
    Business Type: \${prd.metadata.businessName}
    Industry: \${prd.product.description}
    Goals: \${JSON.stringify(prd.goals)}

    Define:
    1. Types of social proof to include:
       - Customer testimonials
       - Company logos
       - Usage statistics
       - Awards/certifications
       - Media mentions
       - Case study highlights
       - User-generated content
       - Ratings/reviews
    2. Credibility indicators priority
    3. Trust-building hierarchy
    4. Industry-specific proof points
    5. Objection-addressing strategy

    Return as JSON with recommendations.\`;

    const strategyResponse = await this.llm(strategyPrompt);
    const strategy = JSON.parse(strategyResponse);

    // Step 2: Generate Testimonial Content
    const testimonialPrompt = \`Create realistic testimonials based on:

    Product Benefits: \${JSON.stringify(prd.product.benefits)}
    Pain Points Solved: \${JSON.stringify(prd.audience.painPoints)}
    Target Personas: \${JSON.stringify(prd.audience)}
    Value Props: \${JSON.stringify(prd.product.uniqueValueProps)}

    Generate 6-8 testimonials with:
    1. Customer quote
       - Specific benefits mentioned
       - Emotional language
       - Quantifiable results (where applicable)
       - Natural, authentic voice
    2. Customer details
       - Name
       - Title/Role
       - Company (size/industry)
       - Location (if relevant)
    3. Context
       - Use case
       - Before/after scenario
       - Time using product
    4. Rating (if applicable)

    Ensure diversity in:
    - Industries represented
    - Company sizes
    - Use cases
    - Benefits highlighted

    Return as JSON.\`;

    const testimonialResponse = await this.llm(testimonialPrompt);
    const testimonials = JSON.parse(testimonialResponse);

    // Step 3: Design Layout and Structure
    const layoutPrompt = \`Design the testimonials section layout:

    Number of testimonials: \${testimonials.testimonials.length}
    Other proof elements: \${JSON.stringify(strategy.recommendedTypes)}
    Design style: \${prd.requirements.style.design}

    Create layout options:
    1. Carousel/slider layouts
       - Single vs. multiple visible
       - Navigation style
       - Auto-play considerations
    2. Grid layouts
       - Card-based design
       - Masonry vs. uniform
    3. Logo bar/banner
       - Scrolling vs. static
       - Grayscale vs. color
    4. Statistics display
       - Counter animations
       - Visual representations
    5. Mixed layouts
       - Combining testimonials with logos
       - Stats with quotes

    Define:
    - Visual hierarchy
    - Responsive behavior
    - Loading/reveal animations
    - Interactive elements

    Return as JSON.\`;

    const layoutResponse = await this.llm(layoutPrompt);
    const layout = JSON.parse(layoutResponse);

    // Step 4: Create Supporting Visuals
    const visualPrompt = \`Design visual elements for social proof:

    Layout: \${JSON.stringify(layout.recommended)}
    Brand Style: \${prd.requirements.style.design}
    Colors: \${JSON.stringify(prd.requirements.style.colors)}

    Specify:
    1. Customer photos/avatars
       - Style (real photos, illustrations, initials)
       - Placeholder strategy
       - Size and shape
    2. Company logos
       - Display treatment (color, grayscale, etc.)
       - Size normalization
       - Arrangement pattern
    3. Rating visuals
       - Star style
       - Color scheme
       - Partial ratings display
    4. Background elements
       - Quote marks or decorations
       - Patterns or gradients
       - Separator elements
    5. Trust badges
       - Security certifications
       - Awards/recognition
       - Partnership badges

    Return as JSON with specifications.\`;

    const visualResponse = await this.llm(visualPrompt);
    const visuals = JSON.parse(visualResponse);

    // Step 5: Analytics and Optimization
    const analyticsPrompt = \`Configure analytics and optimization for testimonials:

    Layout: \${JSON.stringify(layout.recommended)}
    Goals: \${JSON.stringify(prd.goals)}

    Define:
    1. Engagement tracking
       - Carousel interaction
       - Time spent reading
       - Testimonial clicks
       - Video plays (if applicable)
    2. Conversion impact
       - Testimonial influence on CTAs
       - Most effective testimonials
       - Placement optimization
    3. A/B testing options
       - Number of testimonials shown
       - Layout variations
       - Content types mix
       - Animation effects
    4. Performance metrics
       - Loading optimization
       - Image lazy loading
       - Animation performance
    5. SEO optimization
       - Schema markup for reviews
       - Rich snippets eligibility
       - Content indexability

    Return as JSON.\`;

    const analyticsResponse = await this.llm(analyticsPrompt);
    const analytics = JSON.parse(analyticsResponse);

    // Final Testimonials Section Compilation
    const testimonialsSection = {
      type: "testimonials",
      structure: {
        layout: layout.recommended,
        alternativeLayouts: layout.alternatives,
        componentMix: strategy.recommendedTypes,
        displayCount: layout.recommended.visibleCount,
        hierarchy: layout.hierarchy
      },
      style: {
        theme: prd.requirements.style.design,
        cardStyle: layout.recommended.cardStyle,
        typography: {
          quoteStyle: "italic, larger size",
          attributionStyle: "smaller, muted color",
          headlineStyle: "bold, centered"
        },
        colors: {
          quoteMarks: prd.requirements.style.colors?.accent,
          ratings: "#FFB800",
          background: layout.recommended.background
        },
        animations: layout.animations
      },
      images: {
        customerPhotos: visuals.customerPhotos,
        companyLogos: visuals.companyLogos,
        trustBadges: visuals.trustBadges,
        decorativeElements: visuals.decorative,
        placeholders: visuals.placeholders
      },
      copy: {
        sectionHeadline: {
          primary: "Trusted by thousands of " + prd.audience.primary.title,
          alternatives: [
            "See what our customers say",
            "Join " + strategy.stats.totalCustomers + " happy customers",
            "Real results from real " + prd.audience.primary.title
          ]
        },
        testimonials: testimonials.testimonials,
        stats: strategy.stats,
        trustIndicators: strategy.trustIndicators,
        microcopy: {
          viewMore: "See more reviews",
          ratings: "Based on " + strategy.stats.totalReviews + " reviews"
        }
      },
      ctas: {
        primary: {
          text: "Start your free trial",
          placement: "after testimonials",
          style: "primary button"
        },
        secondary: {
          text: "Read case studies",
          placement: "section bottom",
          style: "text link"
        }
      },
      analytics: {
        events: analytics.events,
        conversionTracking: analytics.conversionImpact,
        abTests: analytics.abTests,
        performanceMetrics: analytics.performance
      },
      seo: {
        schema: analytics.seo.schema,
        structuredData: {
          type: "AggregateRating",
          reviewCount: strategy.stats.totalReviews,
          ratingValue: strategy.stats.averageRating
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        dependencies: ["features"],
        socialProofStrategy: strategy
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(testimonialsSection, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: "Testimonials section generated successfully!" } };
  }
}
`;