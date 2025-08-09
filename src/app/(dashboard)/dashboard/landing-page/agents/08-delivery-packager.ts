export const deliveryPackagerCode = `
import { Agent } from "agents";

export class DeliveryPackager extends Agent {
  async *run() {
    const { prd, sections, review, userId, teamId, landingPageName } = this.input;

    yield { type: "status", status: { isRunning: true, output: "" } };
    yield { type: "status", status: { isRunning: true, output: "📦 Packaging landing page deliverables..." } };

    // Step 1: Organize Sections by Component
    yield { type: "status", status: { isRunning: true, output: "🗂️ Organizing sections and components..." } };

    const organizedSections = {};
    for (const section of sections) {
      organizedSections[section.type] = {
        structure: section.structure,
        style: section.style,
        copy: section.copy,
        images: section.images,
        ctas: section.ctas,
        analytics: section.analytics,
        seo: section.seo,
        metadata: section.metadata
      };
    }

    // Step 2: Generate React Components
    yield { type: "status", status: { isRunning: true, output: "⚛️ Generating React component code..." } };

    const reactComponents = {};
    for (const [sectionType, sectionData] of Object.entries(organizedSections)) {
      const componentPrompt = \`Generate a production-ready React component for this \${sectionType} section:

      Section Data: \${JSON.stringify(sectionData)}
      Design System: Tailwind CSS + Shadcn UI

      Requirements:
      1. TypeScript with proper typing
      2. Responsive design
      3. Accessibility compliant
      4. Performance optimized
      5. Event tracking integrated
      6. SEO meta tags included

      Include:
      - Component code
      - Required imports
      - Props interface
      - Default props
      - Usage example

      Return as JSON with 'code', 'imports', 'props', 'usage' keys.\`;

      const componentResponse = await this.llm(componentPrompt);
      reactComponents[sectionType] = JSON.parse(componentResponse);
    }

    // Step 3: Generate HTML Templates
    yield { type: "status", status: { isRunning: true, output: "🌐 Creating HTML templates..." } };

    const htmlTemplates = {};
    for (const [sectionType, sectionData] of Object.entries(organizedSections)) {
      const htmlPrompt = \`Generate semantic HTML for this \${sectionType} section:

      Section Data: \${JSON.stringify(sectionData)}

      Requirements:
      1. Semantic HTML5
      2. Inline critical CSS
      3. Microdata/Schema markup
      4. Accessibility attributes
      5. Responsive images

      Return as JSON with 'html', 'css', 'javascript' keys.\`;

      const htmlResponse = await this.llm(htmlPrompt);
      htmlTemplates[sectionType] = JSON.parse(htmlResponse);
    }

    // Step 4: Create Implementation Guide
    yield { type: "status", status: { isRunning: true, output: "📚 Creating implementation guide..." } };

    const implementationGuide = {
      overview: {
        projectName: landingPageName || prd.metadata.businessName + " Landing Page",
        generatedDate: new Date().toISOString(),
        prdVersion: prd.metadata.version,
        sectionsIncluded: Object.keys(organizedSections),
        architectureScore: review?.summary?.overallScore || "Not reviewed"
      },
      setup: {
        dependencies: {
          react: "^18.2.0",
          next: "^14.0.0",
          tailwindcss: "^3.4.0",
          "@shadcn/ui": "latest",
          "framer-motion": "^10.0.0"
        },
        environment: {
          node: ">=18.0.0",
          packageManager: "pnpm recommended"
        },
        installation: [
          "Clone the repository",
          "Run 'pnpm install'",
          "Configure environment variables",
          "Run 'pnpm dev' for development"
        ]
      },
      structure: {
        components: Object.keys(reactComponents).map(key => ({
          name: key,
          path: \`/components/landing/\${key}.tsx\`,
          dependencies: reactComponents[key].imports
        })),
        pages: [{
          name: "Landing Page",
          path: "/app/page.tsx",
          sections: Object.keys(organizedSections)
        }],
        assets: {
          images: "/public/images/landing/",
          fonts: "/public/fonts/",
          icons: "/public/icons/"
        }
      },
      deployment: {
        platforms: ["Vercel", "Netlify", "Cloudflare Pages"],
        buildCommand: "pnpm build",
        outputDirectory: ".next",
        environmentVariables: [
          "NEXT_PUBLIC_API_URL",
          "NEXT_PUBLIC_ANALYTICS_ID",
          "NEXT_PUBLIC_GTM_ID"
        ]
      },
      customization: {
        colors: prd.requirements.style.colors,
        fonts: prd.requirements.style.typography,
        spacing: "Tailwind default scale",
        breakpoints: {
          mobile: "640px",
          tablet: "768px",
          desktop: "1024px",
          wide: "1280px"
        }
      },
      analytics: {
        setup: "See analytics configuration in each component",
        events: Object.entries(organizedSections).reduce((acc, [key, section]) => {
          acc[key] = section.analytics.events;
          return acc;
        }, {}),
        goals: prd.goals
      }
    };

    // Step 5: Create Export Formats
    yield { type: "status", status: { isRunning: true, output: "💾 Preparing export formats..." } };

    const exportFormats = {
      json: {
        prd: prd,
        sections: organizedSections,
        review: review,
        metadata: {
          version: "1.0",
          format: "structured-json",
          created: new Date().toISOString()
        }
      },
      react: {
        components: reactComponents,
        layout: \`import { Hero } from '@/components/landing/hero';
import { Navigation } from '@/components/landing/navigation';
import { Features } from '@/components/landing/features';
import { Testimonials } from '@/components/landing/testimonials';
import { Contact } from '@/components/landing/contact';

export default function LandingPage() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Contact />
      </main>
    </>
  );
}\`,
        imports: Object.values(reactComponents).flatMap(c => c.imports)
      },
      html: {
        sections: htmlTemplates,
        fullPage: Object.values(htmlTemplates).map(t => t.html).join('\\n'),
        styles: Object.values(htmlTemplates).map(t => t.css).join('\\n'),
        scripts: Object.values(htmlTemplates).map(t => t.javascript).filter(Boolean).join('\\n')
      },
      markdown: \`# \${implementationGuide.overview.projectName}

## Overview
Generated on: \${implementationGuide.overview.generatedDate}
Architecture Score: \${implementationGuide.overview.architectureScore}/10

## Sections
\${Object.entries(organizedSections).map(([type, section]) => \`
### \${type.charAt(0).toUpperCase() + type.slice(1)} Section
**Headlines:**
- Primary: \${section.copy.headlines?.primary || section.copy.sectionHeadline?.primary || 'N/A'}

**CTAs:**
- Primary: \${section.ctas.primary?.text || 'N/A'}
- Secondary: \${section.ctas.secondary?.text || 'N/A'}

**Key Features:**
\${JSON.stringify(section.structure, null, 2)}
\`).join('\\n')}

## Implementation Guide
\${JSON.stringify(implementationGuide, null, 2)}
\`
    };

    // Step 6: Prepare Database Storage
    yield { type: "status", status: { isRunning: true, output: "💾 Preparing for database storage..." } };

    const databaseRecord = {
      id: \`lp_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      userId: userId,
      teamId: teamId,
      name: landingPageName || prd.metadata.businessName + " Landing Page",
      prd: prd,
      sections: organizedSections,
      metadata: {
        review: review,
        implementationGuide: implementationGuide,
        exportFormats: {
          available: ["json", "react", "html", "markdown"],
          generated: new Date().toISOString()
        }
      },
      version: 1,
      status: "draft"
    };

    // Final Delivery Package
    const deliveryPackage = {
      summary: {
        name: implementationGuide.overview.projectName,
        sections: Object.keys(organizedSections),
        formats: Object.keys(exportFormats),
        readyForImplementation: review?.compatibility?.techReady !== false,
        estimatedBuildTime: "4-8 hours",
        architectureScore: review?.summary?.overallScore || "Not reviewed"
      },
      sections: organizedSections,
      components: {
        react: reactComponents,
        html: htmlTemplates
      },
      exports: exportFormats,
      implementation: implementationGuide,
      database: databaseRecord,
      actions: {
        save: {
          enabled: true,
          endpoint: "/api/landing-pages",
          method: "POST"
        },
        export: {
          formats: ["json", "react", "html", "markdown", "zip"],
          endpoint: "/api/landing-pages/export"
        },
        share: {
          enabled: true,
          permissions: ["view", "edit", "comment"],
          expiry: "30 days"
        }
      },
      metadata: {
        packagedAt: new Date().toISOString(),
        version: "1.0",
        generator: "Landing Page Creation System v2.0"
      }
    };

    yield { type: "status", status: { isRunning: false, output: JSON.stringify(deliveryPackage, null, 2) } };
    yield { type: "toast", toast: {
      type: "success",
      message: \`Landing page packaged successfully! \${Object.keys(organizedSections).length} sections ready for implementation.\`
    } };
  }
}
`;