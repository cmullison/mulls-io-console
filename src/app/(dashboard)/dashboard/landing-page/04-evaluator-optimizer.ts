export const evaluatorOptimizerCode = `
import { Agent } from "agents";

export class EvaluatorCopyOptimizer extends Agent {
  async *run() {
    const { 
      existingCopy, 
      sectionType, 
      optimizationGoals, 
      targetAudience, 
      competitorExamples,
      performanceMetrics 
    } = this.input;
    
    yield { type: "status", status: { isRunning: true, output: "" } };
    
    let currentCopy = existingCopy;
    let iterationCount = 0;
    const maxIterations = 3;
    let bestVersion = null;
    let bestScore = 0;
    
    while (iterationCount < maxIterations) {
      iterationCount++;
      
      // Generate improved version
      yield { type: "status", status: { isRunning: true, output: \`🔄 Iteration \${iterationCount}: Generating improved copy...\` } };
      
      const improvementPrompt = \`Optimize this \${sectionType} copy for better conversion:
      
      Current Copy: \${JSON.stringify(currentCopy)}
      Optimization Goals: \${optimizationGoals}
      Target Audience: \${targetAudience}
      Competitor Examples: \${competitorExamples}
      Performance Context: \${performanceMetrics}
      
      Create an improved version focusing on:
      1. Clarity and readability
      2. Emotional impact and persuasion
      3. Action-oriented language
      4. Address pain points and objections
      5. Unique value proposition emphasis
      
      Return JSON with the same structure as input but with optimized content.\`;
      
      const improvedResponse = await this.llm(improvementPrompt);
      const improvedCopy = JSON.parse(improvedResponse);
      
      // Evaluate the improved version
      yield { type: "status", status: { isRunning: true, output: \`📊 Iteration \${iterationCount}: Evaluating improvements...\` } };
      
      const evaluationPrompt = \`Evaluate this landing page copy for conversion potential:
      
      Original: \${JSON.stringify(currentCopy)}
      Improved: \${JSON.stringify(improvedCopy)}
      
      Section Type: \${sectionType}
      Goals: \${optimizationGoals}
      Audience: \${targetAudience}
      
      Rate the improved version on a scale of 1-100 and provide detailed analysis:
      
      Return JSON with:
      - overallScore: number (1-100)
      - improvements: array of specific improvements made
      - strengths: array of strong elements
      - weaknesses: array of areas still needing work
      - conversionFactors: analysis of conversion-driving elements
      - readabilityScore: 1-100
      - persuasionScore: 1-100
      - clarityScore: 1-100
      - recommendedNextSteps: array of suggestions for further improvement
      - abTestRecommendations: specific elements to A/B test\`;
      
      const evaluationResponse = await this.llm(evaluationPrompt);
      const evaluation = JSON.parse(evaluationResponse);
      
      yield { type: "status", status: { isRunning: true, output: JSON.stringify({
        iteration: iterationCount,
        score: evaluation.overallScore,
        improvements: evaluation.improvements,
        copy: improvedCopy
      }, null, 2) } };
      
      // Track best version
      if (evaluation.overallScore > bestScore) {
        bestScore = evaluation.overallScore;
        bestVersion = {
          copy: improvedCopy,
          evaluation: evaluation,
          iteration: iterationCount
        };
      }
      
      // Check if we should continue iterating
      if (evaluation.overallScore >= 85 || iterationCount === maxIterations) {
        break;
      }
      
      // Use improved copy for next iteration
      currentCopy = improvedCopy;
      
      // Brief pause between iterations
      yield { type: "status", status: { isRunning: true, output: \`⏱️ Preparing iteration \${iterationCount + 1}...\` } };
    }
    
    // Generate A/B test variations
    yield { type: "status", status: { isRunning: true, output: "🧪 Creating A/B test variations..." } };
    
    const abTestPrompt = \`Create 3 A/B test variations of this optimized \${sectionType} copy:
    
    Best Version: \${JSON.stringify(bestVersion.copy)}
    Test Focus: \${bestVersion.evaluation.abTestRecommendations.join(', ')}
    
    Create variations that test different approaches:
    1. Variation A: Focus on emotional appeal
    2. Variation B: Focus on logical benefits  
    3. Variation C: Focus on urgency/scarcity
    
    Return JSON with:
    - variationA: copy variation
    - variationB: copy variation  
    - variationC: copy variation
    - testHypotheses: what each variation aims to prove
    - metricsToTrack: key metrics for measuring success\`;
    
    const abTestResponse = await this.llm(abTestPrompt);
    const abTestVariations = JSON.parse(abTestResponse);
    
    // Generate implementation guidelines
    yield { type: "status", status: { isRunning: true, output: "📋 Creating implementation guidelines..." } };
    
    const implementationPrompt = \`Create implementation guidelines for this optimized copy:
    
    Optimized Copy: \${JSON.stringify(bestVersion.copy)}
    Section Type: \${sectionType}
    Evaluation: \${JSON.stringify(bestVersion.evaluation)}
    
    Return JSON with:
    - designRequirements: specific design needs for the copy
    - technicalNotes: implementation considerations
    - contentGuidelines: tone, voice, and style notes
    - performanceExpectations: expected conversion improvements
    - monitoringPlan: what to track post-implementation
    - fallbackOptions: alternative approaches if needed\`;
    
    const implementationResponse = await this.llm(implementationPrompt);
    const implementation = JSON.parse(implementationResponse);
    
    // Final results compilation
    const optimizationResults = {
      originalCopy: existingCopy,
      optimizedCopy: bestVersion.copy,
      optimization: {
        totalIterations: iterationCount,
        finalScore: bestScore,
        improvementAreas: bestVersion.evaluation.improvements,
        strengths: bestVersion.evaluation.strengths,
        weaknesses: bestVersion.evaluation.weaknesses
      },
      abTesting: abTestVariations,
      implementation: implementation,
      metadata: {
        sectionType,
        optimizationGoals,
        targetAudience,
        optimizedAt: new Date().toISOString(),
        scoreImprovement: bestScore - (performanceMetrics?.currentScore || 50)
      }
    };
    
    yield { type: "status", status: { isRunning: false, output: JSON.stringify(optimizationResults, null, 2) } };
    yield { type: "toast", toast: { 
      type: "success", 
      message: \`Copy optimized through \${iterationCount} iterations! Final score: \${bestScore}/100\` 
    } };
  }
}
`;