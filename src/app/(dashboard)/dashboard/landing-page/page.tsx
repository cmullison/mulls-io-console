"use client";

import { PageHeader } from "@/components/page-header";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import { sequentialBuilderCode } from "./01-sequential-builder";
import { parallelSectionsCode } from "./02-parallel-sections";
import { orchestratorCreatorCode } from "./03-orchestrator-creator";
import { evaluatorOptimizerCode } from "./04-evaluator-optimizer";
import { useAgent } from "agents/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  Square,
  Zap,
  Layers,
  TrendingUp,
  FileText,
  Globe,
} from "lucide-react";
import { toast as showToast } from "sonner";
import PageBanner from "@/components/page-banner";
import { OutputDisplay } from "@/components/output-display";

type WorkflowStatus = {
  isRunning: boolean;
  output: string;
};

type WorkflowType =
  | "sequentialBuilder"
  | "parallelSections"
  | "orchestratorCreator"
  | "evaluatorOptimizer";

type FormState = {
  sequentialBuilder: {
    productName: string;
    targetAudience: string;
    primaryGoal: string;
    industry: string;
  };
  parallelSections: {
    brandName: string;
    productDetails: string;
    targetMarket: string;
    tone: string;
    designStyle: string;
  };
  orchestratorCreator: {
    productName: string;
    productDescription: string;
    targetAudience: string;
    businessGoals: string;
    competitors: string;
    brandGuidelines: string;
    contentRequirements: string;
  };
  evaluatorOptimizer: {
    existingCopy: string;
    sectionType: string;
    optimizationGoals: string;
    targetAudience: string;
    competitorExamples: string;
    performanceMetrics: string;
  };
};

const SECTION_TYPES = [
  { label: "Hero Section", value: "hero" },
  { label: "Features", value: "features" },
  { label: "Social Proof", value: "socialProof" },
  { label: "About/Story", value: "about" },
  { label: "Pricing", value: "pricing" },
  { label: "FAQ", value: "faq" },
  { label: "CTA", value: "cta" },
] as const;

const TONE_OPTIONS = [
  { label: "Professional", value: "professional" },
  { label: "Friendly", value: "friendly" },
  { label: "Bold", value: "bold" },
  { label: "Minimalist", value: "minimalist" },
  { label: "Playful", value: "playful" },
  { label: "Luxury", value: "luxury" },
] as const;

const DESIGN_STYLES = [
  { label: "Modern/Clean", value: "modern" },
  { label: "Tech/SaaS", value: "tech" },
  { label: "Creative/Agency", value: "creative" },
  { label: "E-commerce", value: "ecommerce" },
  { label: "Corporate", value: "corporate" },
  { label: "Startup", value: "startup" },
] as const;

function getOrCreateSessionId() {
  const stored = globalThis.localStorage?.getItem("landingPageSessionId");
  if (stored) return stored;

  const newId = nanoid(8);
  globalThis.localStorage?.setItem("landingPageSessionId", newId);
  return newId;
}

function PatternSection({
  type,
  sessionId,
}: {
  type: WorkflowType;
  sessionId: string;
}) {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    isRunning: false,
    output: "",
  });

  const [copiedText, setCopiedText] = useState("");

  const [formState, setFormState] = useState<FormState[typeof type]>(() => {
    switch (type) {
      case "sequentialBuilder":
        return {
          productName: "AI Task Assistant",
          targetAudience: "busy professionals",
          primaryGoal: "increase productivity",
          industry: "SaaS",
        };
      case "parallelSections":
        return {
          brandName: "TaskFlow Pro",
          productDetails: "AI-powered task management with smart automation",
          targetMarket: "remote teams and freelancers",
          tone: "professional",
          designStyle: "modern",
        };
      case "orchestratorCreator":
        return {
          productName: "CloudSync",
          productDescription:
            "Unified cloud storage solution with AI-powered file organization",
          targetAudience: "SMB and enterprise teams",
          businessGoals: "increase trial signups and reduce churn",
          competitors: "Dropbox, Google Drive, Box",
          brandGuidelines:
            "Clean, trustworthy, innovative, blue and white color scheme",
          contentRequirements:
            "Professional tone, focus on security and collaboration",
        };
      case "evaluatorOptimizer":
        return {
          existingCopy:
            '{"headline": "Manage Your Tasks Better", "subheadline": "Our app helps you stay organized", "ctaText": "Get Started"}',
          sectionType: "hero",
          optimizationGoals: "increase click-through rate and engagement",
          targetAudience: "busy professionals aged 25-45",
          competitorExamples:
            "Notion: Build your wiki, docs & projects. Asana: Hit your goals faster.",
          performanceMetrics: "Current CTR: 2.3%, Bounce rate: 65%",
        };
    }
  });

  const socket = useAgent({
    agent: type,
    name: sessionId,
    onMessage: (e) => {
      const data = JSON.parse(e.data);
      switch (data.type) {
        case "status":
          setWorkflowStatus(data.status);
          break;
        case "toast": {
          const event = new CustomEvent("showToast", {
            detail: {
              message: data.toast.message,
              type: data.toast.type,
            },
          });
          window.dispatchEvent(event);
          break;
        }
      }
    },
    prefix: "agents",
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      showToast.success("Copied to clipboard!");
      setTimeout(() => setCopiedText(""), 2000);
    } catch {
      showToast.error("Failed to copy to clipboard");
    }
  };

  const parseOutput = (output: string) => {
    try {
      return JSON.parse(output);
    } catch {
      return { text: output };
    }
  };

  const getPatternIcon = () => {
    switch (type) {
      case "sequentialBuilder":
        return <Zap className="h-4 w-4" />;
      case "parallelSections":
        return <Layers className="h-4 w-4" />;
      case "orchestratorCreator":
        return <Globe className="h-4 w-4" />;
      case "evaluatorOptimizer":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const getFormContent = () => {
    if (type === "sequentialBuilder") {
      const state = formState as FormState["sequentialBuilder"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <Label className="font-medium">
                Sequential Landing Page Builder
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={state.productName}
                  onChange={handleInputChange}
                  placeholder="e.g., AI Task Assistant"
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  value={state.industry}
                  onChange={handleInputChange}
                  placeholder="e.g., SaaS"
                  className="bg-background"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                name="targetAudience"
                value={state.targetAudience}
                onChange={handleInputChange}
                placeholder="e.g., busy professionals"
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="primaryGoal">Primary Goal</Label>
              <Input
                id="primaryGoal"
                name="primaryGoal"
                value={state.primaryGoal}
                onChange={handleInputChange}
                placeholder="e.g., increase productivity"
                className="bg-background"
              />
            </div>
          </div>
        </Card>
      );
    }

    if (type === "parallelSections") {
      const state = formState as FormState["parallelSections"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <Label className="font-medium">Parallel Sections Generator</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  name="brandName"
                  value={state.brandName}
                  onChange={handleInputChange}
                  placeholder="e.g., TaskFlow Pro"
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="targetMarket">Target Market</Label>
                <Input
                  id="targetMarket"
                  name="targetMarket"
                  value={state.targetMarket}
                  onChange={handleInputChange}
                  placeholder="e.g., remote teams"
                  className="bg-background"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="productDetails">Product Details</Label>
              <Textarea
                id="productDetails"
                name="productDetails"
                value={state.productDetails}
                onChange={handleInputChange}
                placeholder="Brief description of your product and key features"
                rows={3}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select
                  value={state.tone}
                  onValueChange={(value) => {
                    setFormState((prev) => ({ ...prev, tone: value }));
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="designStyle">Design Style</Label>
                <Select
                  value={state.designStyle}
                  onValueChange={(value) => {
                    setFormState((prev) => ({ ...prev, designStyle: value }));
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGN_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (type === "orchestratorCreator") {
      const state = formState as FormState["orchestratorCreator"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <Label className="font-medium">Complete Page Creator</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={state.productName}
                  onChange={handleInputChange}
                  placeholder="e.g., CloudSync"
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  value={state.targetAudience}
                  onChange={handleInputChange}
                  placeholder="e.g., SMB and enterprise teams"
                  className="bg-background"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="productDescription">Product Description</Label>
              <Textarea
                id="productDescription"
                name="productDescription"
                value={state.productDescription}
                onChange={handleInputChange}
                placeholder="Detailed description of your product, features, and benefits"
                rows={3}
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="businessGoals">Business Goals</Label>
              <Textarea
                id="businessGoals"
                name="businessGoals"
                value={state.businessGoals}
                onChange={handleInputChange}
                placeholder="e.g., increase trial signups and reduce churn"
                rows={2}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="competitors">Competitors</Label>
                <Input
                  id="competitors"
                  name="competitors"
                  value={state.competitors}
                  onChange={handleInputChange}
                  placeholder="e.g., Dropbox, Google Drive"
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="brandGuidelines">Brand Guidelines</Label>
                <Input
                  id="brandGuidelines"
                  name="brandGuidelines"
                  value={state.brandGuidelines}
                  onChange={handleInputChange}
                  placeholder="e.g., Clean, trustworthy, blue theme"
                  className="bg-background"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="contentRequirements">Content Requirements</Label>
              <Input
                id="contentRequirements"
                name="contentRequirements"
                value={state.contentRequirements}
                onChange={handleInputChange}
                placeholder="e.g., Professional tone, focus on security"
                className="bg-background"
              />
            </div>
          </div>
        </Card>
      );
    }

    if (type === "evaluatorOptimizer") {
      const state = formState as FormState["evaluatorOptimizer"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <Label className="font-medium">Copy Optimizer</Label>
            </div>
            <div>
              <Label htmlFor="existingCopy">Existing Copy (JSON)</Label>
              <Textarea
                id="existingCopy"
                name="existingCopy"
                value={state.existingCopy}
                onChange={handleInputChange}
                placeholder='{"headline": "Your current headline", "description": "Current description"}'
                rows={4}
                className="bg-background font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sectionType">Section Type</Label>
                <Select
                  value={state.sectionType}
                  onValueChange={(value) => {
                    setFormState((prev) => ({ ...prev, sectionType: value }));
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((section) => (
                      <SelectItem key={section.value} value={section.value}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  value={state.targetAudience}
                  onChange={handleInputChange}
                  placeholder="e.g., busy professionals aged 25-45"
                  className="bg-background"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="optimizationGoals">Optimization Goals</Label>
              <Input
                id="optimizationGoals"
                name="optimizationGoals"
                value={state.optimizationGoals}
                onChange={handleInputChange}
                placeholder="e.g., increase click-through rate and engagement"
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="competitorExamples">Competitor Examples</Label>
              <Input
                id="competitorExamples"
                name="competitorExamples"
                value={state.competitorExamples}
                onChange={handleInputChange}
                placeholder="Examples of competitor copy that works well"
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="performanceMetrics">Current Performance</Label>
              <Input
                id="performanceMetrics"
                name="performanceMetrics"
                value={state.performanceMetrics}
                onChange={handleInputChange}
                placeholder="e.g., Current CTR: 2.3%, Bounce rate: 65%"
                className="bg-background"
              />
            </div>
          </div>
        </Card>
      );
    }
  };

  const runWorkflow = async () => {
    try {
      socket.send(
        JSON.stringify({
          input: formState,
          type: "run",
        })
      );
      showToast.info(`Started ${type} workflow...`);
    } catch {
      showToast.error(`Failed to start ${type} workflow`);
    }
  };

  return (
    <div className="space-y-4">
      {getFormContent()}

      <div className="flex items-center gap-2">
        <Button
          onClick={runWorkflow}
          disabled={workflowStatus.isRunning}
          className="flex items-center gap-2"
        >
          {workflowStatus.isRunning ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {workflowStatus.output ? "Run Again" : "Run"}
            </>
          )}
        </Button>
        {workflowStatus.isRunning && (
          <Button
            variant="outline"
            onClick={() => {
              socket.send(JSON.stringify({ type: "stop" }));
              showToast.info(`Stopping ${type} workflow...`);
            }}
            className="flex items-center gap-2"
          >
            <Square className="h-3 w-3" />
            Stop
          </Button>
        )}
      </div>

      {workflowStatus.output ? (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            {getPatternIcon()}
            <Label className="text-sm font-medium">Generated Content</Label>
          </div>
          <OutputDisplay
            output={parseOutput(workflowStatus.output)}
            onCopy={copyToClipboard}
            copiedText={copiedText}
            type={type}
          />
        </div>
      ) : (
        <div className="mt-6">
          <Card className="p-8 text-center bg-muted/20 border-dashed">
            <div className="flex flex-col items-center gap-3">
              {getPatternIcon()}
              <p className="text-muted-foreground">
                Fill in the form above and click &apos;Run&apos; to generate{" "}
                {type}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function LandingPageApp() {
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  useEffect(() => {
    const handleToast = (e: CustomEvent<{ type: string; message: string }>) => {
      const toastType = e.detail.type === "error" ? "error" : "info";
      showToast[toastType](e.detail.message);
    };

    window.addEventListener("showToast", handleToast as EventListener);

    return () => {
      window.removeEventListener("showToast", handleToast as EventListener);
    };
  }, []);

  const patterns = {
    sequentialBuilder: {
      code: sequentialBuilderCode,
      description:
        "Step-by-step landing page builder creating hero, features, social proof, and CTA sections in sequence.",
      title: "Sequential Page Builder",
    },
    parallelSections: {
      code: parallelSectionsCode,
      description:
        "Generate multiple landing page sections simultaneously with brand consistency checks.",
      title: "Parallel Sections Generator",
    },
    orchestratorCreator: {
      code: orchestratorCreatorCode,
      description:
        "Complete landing page orchestration with strategy, specialized workers, and design guidelines.",
      title: "Complete Page Creator",
    },
    evaluatorOptimizer: {
      code: evaluatorOptimizerCode,
      description:
        "Iterative optimization of existing copy with A/B testing suggestions and conversion improvements.",
      title: "Copy Optimizer",
    },
  };

  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard",
            label: "Dashboard",
          },
          {
            href: "/dashboard/landing-page",
            label: "Landing Page Creator",
          },
        ]}
      />
      <PageBanner
        bannerDescription="Create high-converting landing pages with AI-powered copywriting and design guidance."
        bannerTitle="Landing Page Creator"
      />
      <div className="container mx-auto px-4 py-8 pb-12">
        <main>
          <Accordion type="multiple" className="w-full space-y-6">
            {(
              Object.entries(patterns) as [
                WorkflowType,
                (typeof patterns)[keyof typeof patterns]
              ][]
            ).map(([type, pattern], index) => (
              <AccordionItem
                key={type}
                value={type}
                className="border border-border rounded-lg px-6 bg-card hover:bg-card/80 transition-colors shadow-sm !border-b-0"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex items-center gap-3 text-left w-full">
                    <Badge variant="outline" className="shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-lg">
                        {pattern.title}
                      </div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {pattern.description}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <PatternSection type={type} sessionId={sessionId} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </main>
      </div>
    </>
  );
}
