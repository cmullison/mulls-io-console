export const contactAgentCode = `
import { Agent } from "agents";

export class ContactAgent extends Agent {
  async *run() {
    const { prd, sectionRequirements, previousSections } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "📞 Building contact and final CTA section..." } };

    // Step 1: Analyze Conversion Path
    const conversionPrompt = \`Analyze the conversion path and create final CTA strategy:

    Business Goals: \${JSON.stringify(prd.goals)}
    Conversion Strategy: \${JSON.stringify(prd.strategy.conversion)}
    Previous Sections: \${JSON.stringify(previousSections?.map(s => ({ type: s.type, ctas: s.ctas })))}
    User Journey: \${JSON.stringify(prd.strategy.userJourney)}

    Define:
    1. Primary conversion action
       - Form submission vs. direct action
       - Information required
       - Friction reduction tactics
    2. Alternative conversion paths
       - Secondary CTAs
       - Low-commitment options
       - Contact preferences
    3. Trust reinforcement
       - Final objection handling
       - Urgency/scarcity elements
       - Risk reversal
    4. Follow-up strategy
       - Thank you page flow
       - Email automation triggers
       - Next steps clarity

    Return as JSON.\`;

    const conversionResponse = await this.llm(conversionPrompt);
    const conversionStrategy = JSON.parse(conversionResponse);

    // Step 2: Design Contact Form/CTA Structure
    const structurePrompt = \`Design the contact/CTA section structure:

    Conversion Strategy: \${JSON.stringify(conversionStrategy)}
    Design Style: \${prd.requirements.style.design}
    Business Type: \${prd.metadata.businessName}

    Create structure options:
    1. Form-based layouts
       - Split screen (form + benefits)
       - Centered form with context
       - Multi-step form
       - Minimal fields approach
    2. Direct CTA layouts
       - Hero-style CTA block
       - Pricing-to-action flow
       - Demo/trial emphasis
    3. Contact options layout
       - Multiple contact methods
       - Live chat integration
       - Calendar booking
       - Support channels
    4. Hybrid approaches
       - Form with alternative CTAs
       - Progressive disclosure

    Include:
    - Field organization
    - Visual hierarchy
    - White space usage
    - Mobile optimization

    Return as JSON.\`;

    const structureResponse = await this.llm(structurePrompt);
    const structure = JSON.parse(structureResponse);

    // Step 3: Generate Copy and Microcopy
    const copyPrompt = \`Create compelling copy for the contact/CTA section:

    Conversion Strategy: \${JSON.stringify(conversionStrategy)}
    Structure: \${JSON.stringify(structure.recommended)}
    Tone: \${prd.requirements.style.tone}
    Pain Points: \${JSON.stringify(prd.audience.painPoints)}

    Generate:
    1. Section headline
       - Benefit-focused
       - Action-oriented
       - Urgency-inducing variants
    2. Supporting copy
       - Value reinforcement
       - Process explanation
       - Trust signals
    3. Form labels and placeholders
       - Clear, friendly labels
       - Helpful placeholders
       - Error messages
       - Success messages
    4. CTA button copy
       - Primary action text variants
       - Secondary action text
       - Loading states
    5. Support copy
       - Privacy assurance
       - No spam promise
       - Response time expectations
       - Contact alternatives
    6. Social proof integration
       - Inline testimonials
       - Success metrics
       - Trust badges placement

    Return as JSON.\`;

    const copyResponse = await this.llm(copyPrompt);
    const copy = JSON.parse(copyResponse);

    // Step 4: Define Form Fields and Validation
    const formPrompt = \`Design form fields and validation for conversion:

    Business Goals: \${JSON.stringify(prd.goals)}
    Conversion Strategy: \${JSON.stringify(conversionStrategy)}
    Audience: \${JSON.stringify(prd.audience)}

    Specify:
    1. Form fields
       - Required fields (minimal)
       - Optional fields (progressive profiling)
       - Field types and formats
       - Smart defaults
    2. Validation rules
       - Client-side validation
       - Real-time feedback
       - Error prevention
       - Accessibility considerations
    3. Progressive disclosure
       - When to show additional fields
       - Conditional logic
       - Multi-step breakdown
    4. Data enrichment
       - Auto-fill capabilities
       - Company lookup
       - Social auth options
    5. Consent and compliance
       - GDPR considerations
       - Marketing consent
       - Terms acceptance

    Return as JSON.\`;

    const formResponse = await this.llm(formPrompt);
    const formConfig = JSON.parse(formResponse);

    // Step 5: Analytics and Optimization Setup
    const analyticsPrompt = \`Configure analytics and optimization for contact/CTA:

    Form Config: \${JSON.stringify(formConfig)}
    Goals: \${JSON.stringify(prd.goals)}
    KPIs: \${JSON.stringify(prd.goals.kpis)}

    Define:
    1. Form analytics
       - Field interaction tracking
       - Abandonment points
       - Time to complete
       - Error frequency
    2. Conversion tracking
       - Submission success
       - Conversion attribution
       - Source tracking
       - Multi-touch attribution
    3. A/B testing priorities
       - Form length variations
       - Field order tests
       - CTA copy tests
       - Design variations
    4. Optimization triggers
       - Exit intent popups
       - Abandonment recovery
       - Smart field reduction
    5. Follow-up metrics
       - Email open rates
       - Demo show rates
       - Sales qualified leads
       - Customer lifetime value

    Return as JSON.\`;

    const analyticsResponse = await this.llm(analyticsPrompt);
    const analytics = JSON.parse(analyticsResponse);

    // Final Contact Section Compilation
    const contactSection = {
      type: "contact",
      structure: {
        layout: structure.recommended,
        alternativeLayouts: structure.alternatives,
        formPlacement: structure.recommended.formPlacement,
        supportElements: structure.recommended.supportElements,
        responsive: structure.responsive
      },
      style: {
        theme: prd.requirements.style.design,
        formStyle: {
          fields: "modern, floating labels",
          buttons: prd.requirements.style.colors?.accent,
          spacing: "generous padding",
          borders: "subtle, on focus highlight"
        },
        background: structure.recommended.background,
        contrast: "high contrast for accessibility"
      },
      images: {
        backgroundPattern: structure.recommended.backgroundImage,
        trustBadges: {
          security: ["SSL", "Privacy", "GDPR"],
          payment: ["Visa", "Mastercard", "PayPal"],
          placement: "below form"
        },
        supportAvatars: "friendly support team photos"
      },
      copy: {
        headlines: copy.headlines,
        supporting: copy.supporting,
        form: {
          labels: copy.formLabels,
          placeholders: copy.placeholders,
          errors: copy.errorMessages,
          success: copy.successMessages
        },
        ctas: copy.ctaButtons,
        trust: copy.trustSignals,
        microcopy: copy.microcopy
      },
      form: {
        fields: formConfig.fields,
        validation: formConfig.validation,
        progressive: formConfig.progressive,
        enrichment: formConfig.enrichment,
        compliance: formConfig.compliance
      },
      ctas: {
        primary: {
          text: copy.ctaButtons.primary,
          action: conversionStrategy.primaryAction,
          style: "large, prominent"
        },
        secondary: conversionStrategy.alternativePaths,
        exit: {
          trigger: "exit intent",
          offer: conversionStrategy.lastChanceOffer
        }
      },
      analytics: {
        formTracking: analytics.formAnalytics,
        conversion: analytics.conversionTracking,
        abTests: analytics.abTests,
        optimization: analytics.optimization,
        followUp: analytics.followUpMetrics
      },
      seo: {
        schema: {
          type: "ContactPage",
          contactType: "sales",
          availableLanguages: ["English"]
        },
        meta: "Contact us for " + prd.product.description
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        dependencies: ["testimonials"],
        conversionStrategy: conversionStrategy
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(contactSection, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: "Contact/CTA section generated successfully!" } };
  }
}
`;