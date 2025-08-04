export const parallelSectionsCode = `
import { Agent } from "agents";

export class ParallelSectionsGenerator extends Agent {
  async *run() {
    const { brandName, productDetails, targetMarket, tone, designStyle } = this.input;
    
    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "🔄 Generating multiple sections in parallel..." } };
    
    // Define prompts for parallel execution
    const heroPrompt = \`Create a hero section for "\${brandName}" with these details: \${productDetails}. 
    Target market: \${targetMarket}. Tone: \${tone}. Design style: \${designStyle}.
    
    Include: headline, subheadline, valueProps (array), ctaText, imagePrompt.
    Return JSON only.\`;
    
    const aboutPrompt = \`Create an about/story section for "\${brandName}". 
    Brand details: \${productDetails}. Target market: \${targetMarket}. Tone: \${tone}.
    
    Include: sectionHeadline, story (compelling narrative), mission, teamImagePrompt, foundersNote.
    Return JSON only.\`;
    
    const benefitsPrompt = \`Create a benefits section for "\${brandName}" highlighting customer value.
    Product details: \${productDetails}. Target market: \${targetMarket}. Tone: \${tone}.
    
    Include: sectionHeadline, benefits (array with title, description, icon), imagePrompt.
    Return JSON only.\`;
    
    const pricingPrompt = \`Create a pricing section for "\${brandName}" if applicable based on: \${productDetails}.
    Target market: \${targetMarket}. Tone: \${tone}.
    
    Include: sectionHeadline, plans (array with name, price, features, recommended boolean), ctaText.
    If not applicable, return: { applicable: false, reason: "explanation" }.
    Return JSON only.\`;
    
    const faqPrompt = \`Create an FAQ section addressing common objections for "\${brandName}".
    Product details: \${productDetails}. Target market: \${targetMarket}.
    
    Include: sectionHeadline, faqs (array with question, answer).
    Return JSON only.\`;
    
    // Execute all prompts in parallel
    const [heroResponse, aboutResponse, benefitsResponse, pricingResponse, faqResponse] = await Promise.all([
      this.llm(heroPrompt),
      this.llm(aboutPrompt), 
      this.llm(benefitsPrompt),
      this.llm(pricingPrompt),
      this.llm(faqPrompt)
    ]);
    
    yield { type: "status", status: { isRunning: true, output: "✅ All sections generated! Processing results..." } };
    
    try {
      const heroData = JSON.parse(heroResponse);
      const aboutData = JSON.parse(aboutResponse);
      const benefitsData = JSON.parse(benefitsResponse);
      const pricingData = JSON.parse(pricingResponse);
      const faqData = JSON.parse(faqResponse);
      
      // Consistency check and optimization
      yield { type: "status", status: { isRunning: true, output: "🔍 Ensuring brand consistency across sections..." } };
      
      const consistencyPrompt = \`Review these landing page sections for brand consistency and suggest optimizations:
      
      Hero: \${JSON.stringify(heroData)}
      About: \${JSON.stringify(aboutData)}
      Benefits: \${JSON.stringify(benefitsData)}
      FAQ: \${JSON.stringify(faqData)}
      
      Brand: \${brandName}, Tone: \${tone}, Target: \${targetMarket}
      
      Return JSON with: consistencyScore (1-10), suggestions (array), optimizedSections (object with any recommended changes).
      If no changes needed, return empty optimizedSections.\`;
      
      const consistencyResponse = await this.llm(consistencyPrompt);
      const consistencyData = JSON.parse(consistencyResponse);
      
      const finalSections = {
        hero: heroData,
        about: aboutData,
        benefits: benefitsData,
        pricing: pricingData,
        faq: faqData,
        consistency: consistencyData,
        metadata: {
          brandName,
          targetMarket,
          tone,
          designStyle,
          generatedAt: new Date().toISOString(),
          generationMethod: "parallel"
        }
      };
      
      yield { type: "status", status: { isRunning: false, output: JSON.stringify(finalSections, null, 2) } };
      yield { type: "toast", toast: { type: "success", message: \`Generated \${Object.keys(finalSections).length - 2} sections with \${consistencyData.consistencyScore}/10 consistency score!\` } };
      
    } catch (error) {
      yield { type: "status", status: { isRunning: false, output: JSON.stringify({ error: "Failed to parse AI responses", details: error.message }, null, 2) } };
      yield { type: "toast", toast: { type: "error", message: "Failed to generate sections. Please try again." } };
    }
  }
}
`;