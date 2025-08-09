export const architectureReviewerCode = `
import { Agent } from "agents";

export class ArchitectureReviewer extends Agent {
  async *run() {
    const { prd, sections } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "🔍 Starting architecture review..." } };

    // Step 1: Brand Consistency Check
    yield { type: "status", status: { isRunning: true, output: "🎨 Checking brand consistency across sections..." } };

    const brandConsistencyPrompt = \`Review brand consistency across all sections:

    PRD Brand Guidelines: \${JSON.stringify(prd.brand)}
    Style Requirements: \${JSON.stringify(prd.requirements.style)}
    Sections: \${JSON.stringify(sections.map(s => ({
      type: s.type,
      style: s.style,
      copy: { tone: s.copy.headlines }
    })))}

    Analyze:
    1. Visual consistency
       - Color usage across sections
       - Typography hierarchy
       - Spacing and rhythm
       - Icon/illustration style
    2. Voice and tone consistency
       - Headline styles
       - Copy tone alignment
       - CTA language patterns
    3. Brand personality expression
       - Consistent messaging
       - Value proposition clarity
       - Emotional consistency
    4. Design pattern consistency
       - Button styles
       - Card treatments
       - Interactive elements

    Score each area 1-10 and provide specific issues found.

    Return as JSON.\`;

    const brandResponse = await this.llm(brandConsistencyPrompt);
    const brandReview = JSON.parse(brandResponse);

    // Step 2: Visual Hierarchy and Flow
    yield { type: "status", status: { isRunning: true, output: "📐 Analyzing visual hierarchy and user flow..." } };

    const hierarchyPrompt = \`Analyze visual hierarchy and user flow:

    Section Order: \${JSON.stringify(sections.map(s => s.type))}
    Section Structures: \${JSON.stringify(sections.map(s => ({
      type: s.type,
      structure: s.structure,
      ctas: s.ctas
    })))}
    User Journey: \${JSON.stringify(prd.strategy.userJourney)}

    Evaluate:
    1. Information hierarchy
       - Logical progression
       - Cognitive load balance
       - Section transitions
       - Reading patterns
    2. Visual weight distribution
       - Emphasis appropriateness
       - Balance across page
       - White space usage
    3. CTA progression
       - Action escalation
       - Conversion funnel flow
       - Decision points
    4. Responsive considerations
       - Mobile hierarchy
       - Breakpoint consistency
       - Touch target spacing

    Identify issues and optimization opportunities.

    Return as JSON.\`;

    const hierarchyResponse = await this.llm(hierarchyPrompt);
    const hierarchyReview = JSON.parse(hierarchyResponse);

    // Step 3: Technical Compatibility
    yield { type: "status", status: { isRunning: true, output: "⚙️ Checking technical compatibility..." } };

    const technicalPrompt = \`Review technical compatibility and performance:

    Sections: \${JSON.stringify(sections.map(s => ({
      type: s.type,
      images: s.images,
      animations: s.style.animations,
      interactive: s.ctas
    })))}

    Check:
    1. Performance impact
       - Total image weight
       - Animation complexity
       - Script requirements
       - Third-party dependencies
    2. Cross-browser compatibility
       - CSS feature usage
       - JavaScript requirements
       - Fallback strategies
    3. Accessibility compliance
       - WCAG standards
       - Keyboard navigation
       - Screen reader compatibility
       - Color contrast
    4. SEO optimization
       - Heading structure
       - Schema markup conflicts
       - Content indexability
       - Page speed factors

    Rate severity of issues: critical, high, medium, low.

    Return as JSON.\`;

    const technicalResponse = await this.llm(technicalPrompt);
    const technicalReview = JSON.parse(technicalResponse);

    // Step 4: Content and Messaging Alignment
    yield { type: "status", status: { isRunning: true, output: "💬 Reviewing content alignment and messaging..." } };

    const contentPrompt = \`Review content and messaging alignment:

    PRD Goals: \${JSON.stringify(prd.goals)}
    PRD Messaging: \${JSON.stringify(prd.strategy)}
    Section Content: \${JSON.stringify(sections.map(s => ({
      type: s.type,
      headlines: s.copy.headlines,
      ctas: s.ctas
    })))}

    Analyze:
    1. Message consistency
       - Value prop reinforcement
       - Benefit communication
       - Pain point addressing
    2. Conversion optimization
       - Persuasion flow
       - Objection handling
       - Trust building progression
    3. Content gaps
       - Missing information
       - Unanswered questions
       - Incomplete user journey
    4. Redundancy issues
       - Repeated content
       - Overlapping messages
       - Unnecessary sections

    Provide specific recommendations.

    Return as JSON.\`;

    const contentResponse = await this.llm(contentPrompt);
    const contentReview = JSON.parse(contentResponse);

    // Step 5: Generate Optimization Recommendations
    yield { type: "status", status: { isRunning: true, output: "💡 Generating optimization recommendations..." } };

    const optimizationPrompt = \`Based on all reviews, generate optimization recommendations:

    Brand Review: \${JSON.stringify(brandReview)}
    Hierarchy Review: \${JSON.stringify(hierarchyReview)}
    Technical Review: \${JSON.stringify(technicalReview)}
    Content Review: \${JSON.stringify(contentReview)}

    Provide:
    1. Critical fixes (must address)
       - Specific changes needed
       - Implementation priority
       - Impact on conversion
    2. High-priority optimizations
       - Quick wins
       - Major improvements
       - User experience enhancements
    3. Auto-fix suggestions
       - Automated corrections possible
       - Specific values to change
       - Safe modifications
    4. A/B test recommendations
       - What to test
       - Hypothesis for each test
       - Success metrics
    5. Future enhancements
       - Long-term improvements
       - Advanced features
       - Scaling considerations

    Return as JSON with actionable items.\`;

    const optimizationResponse = await this.llm(optimizationPrompt);
    const optimizations = JSON.parse(optimizationResponse);

    // Final Architecture Review Compilation
    const architectureReview = {
      summary: {
        overallScore: Math.round(
          (brandReview.overallScore +
           hierarchyReview.overallScore +
           technicalReview.overallScore +
           contentReview.overallScore) / 4
        ),
        status: "reviewed",
        sectionsReviewed: sections.length,
        criticalIssues: [
          ...technicalReview.criticalIssues || [],
          ...hierarchyReview.criticalIssues || []
        ].length
      },
      reviews: {
        brand: {
          score: brandReview.overallScore,
          consistency: brandReview.consistency,
          issues: brandReview.issues,
          recommendations: brandReview.recommendations
        },
        hierarchy: {
          score: hierarchyReview.overallScore,
          flow: hierarchyReview.flow,
          issues: hierarchyReview.issues,
          improvements: hierarchyReview.improvements
        },
        technical: {
          score: technicalReview.overallScore,
          compatibility: technicalReview.compatibility,
          performance: technicalReview.performance,
          accessibility: technicalReview.accessibility,
          issues: technicalReview.issues
        },
        content: {
          score: contentReview.overallScore,
          alignment: contentReview.alignment,
          gaps: contentReview.gaps,
          redundancies: contentReview.redundancies,
          suggestions: contentReview.suggestions
        }
      },
      optimizations: {
        critical: optimizations.criticalFixes,
        highPriority: optimizations.highPriority,
        autoFix: optimizations.autoFix,
        abTests: optimizations.abTests,
        future: optimizations.future
      },
      compatibility: {
        sectionsWork: hierarchyReview.overallScore >= 7,
        brandAligned: brandReview.overallScore >= 7,
        techReady: technicalReview.criticalIssues?.length === 0,
        contentComplete: contentReview.gaps?.length === 0
      },
      metadata: {
        reviewedAt: new Date().toISOString(),
        reviewVersion: "1.0",
        prdVersion: prd.metadata.version,
        recommendations: optimizations.criticalFixes.length + optimizations.highPriority.length
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(architectureReview, null, 2) } };
    yield { type: "toast", toast: {
      type: architectureReview.summary.criticalIssues > 0 ? "warning" : "success",
      message: \`Architecture review complete. Score: \${architectureReview.summary.overallScore}/10 with \${architectureReview.summary.criticalIssues} critical issues.\`
    } };
  }
}
`;