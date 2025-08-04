export const sequentialBuilderCode = `
import { Agent } from "agents";

export class SequentialLandingPageBuilder extends Agent {
  async *run() {
    const { productName, targetAudience, primaryGoal, industry } = this.input;
    
    yield { type: "status", status: { isRunning: true, output: "" } };
    
    // Step 1: Generate Hero Section
    yield { type: "status", status: { isRunning: true, output: "🎯 Creating compelling hero section..." } };
    
    const heroPrompt = \`Create a high-converting hero section for "\${productName}" targeting \${targetAudience}. 
    Primary goal: \${primaryGoal}. Industry: \${industry}.
    
    Include:
    1. Compelling headline (H1)
    2. Supporting subheadline 
    3. Value proposition bullets (3-5)
    4. Primary CTA button text
    5. Hero image description for text-to-image generation
    
    Format as JSON with keys: headline, subheadline, valueProps, ctaText, imagePrompt\`;
    
    const heroResponse = await this.llm(heroPrompt);
    const heroData = JSON.parse(heroResponse);
    
    yield { type: "status", status: { isRunning: true, output: JSON.stringify({ step: "hero", data: heroData }, null, 2) } };
    
    // Step 2: Generate Features Section
    yield { type: "status", status: { isRunning: true, output: "⚡ Building key features section..." } };
    
    const featuresPrompt = \`Based on the hero section: \${JSON.stringify(heroData)}, create a features section for "\${productName}".
    
    Include:
    1. Section headline
    2. 3-6 key features with titles and descriptions
    3. Feature icon descriptions for design
    4. Supporting image prompt for the section
    
    Format as JSON with keys: sectionHeadline, features (array with title, description, icon), imagePrompt\`;
    
    const featuresResponse = await this.llm(featuresPrompt);
    const featuresData = JSON.parse(featuresResponse);
    
    yield { type: "status", status: { isRunning: true, output: JSON.stringify({ step: "features", data: featuresData }, null, 2) } };
    
    // Step 3: Generate Social Proof Section
    yield { type: "status", status: { isRunning: true, output: "🏆 Creating social proof section..." } };
    
    const socialProofPrompt = \`Create social proof section for "\${productName}" targeting \${targetAudience}.
    
    Include:
    1. Section headline
    2. 3-4 realistic testimonials with names and titles
    3. Trust metrics/statistics (if applicable)
    4. Company logos description for design
    
    Format as JSON with keys: sectionHeadline, testimonials (array with quote, name, title, company), stats (array with number, label), logosPrompt\`;
    
    const socialProofResponse = await this.llm(socialProofPrompt);
    const socialProofData = JSON.parse(socialProofResponse);
    
    yield { type: "status", status: { isRunning: true, output: JSON.stringify({ step: "socialProof", data: socialProofData }, null, 2) } };
    
    // Step 4: Generate Final CTA Section
    yield { type: "status", status: { isRunning: true, output: "🚀 Finalizing call-to-action section..." } };
    
    const ctaPrompt = \`Create a compelling final CTA section for "\${productName}" that reinforces the primary goal: \${primaryGoal}.
    
    Include:
    1. Urgency-driven headline
    2. Brief recap of key benefits
    3. Primary CTA button text
    4. Secondary CTA option (if applicable)
    5. Trust signals (guarantees, security, etc.)
    
    Format as JSON with keys: headline, benefits (array), primaryCta, secondaryCta, trustSignals (array)\`;
    
    const ctaResponse = await this.llm(ctaPrompt);
    const ctaData = JSON.parse(ctaResponse);
    
    // Final compilation
    const landingPageSections = {
      hero: heroData,
      features: featuresData,
      socialProof: socialProofData,
      cta: ctaData,
      metadata: {
        productName,
        targetAudience,
        primaryGoal,
        industry,
        generatedAt: new Date().toISOString()
      }
    };
    
    yield { type: "status", status: { isRunning: false, output: JSON.stringify(landingPageSections, null, 2) } };
    yield { type: "toast", toast: { type: "success", message: "Landing page sections generated successfully!" } };
  }
}
`;