"use client";
/** biome-ignore-all lint/a11y/noStaticElementInteractions: it's fine */

import { PageHeader } from "@/components/page-header";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import { sequentialCode } from "./01-sequential";
import { routingCode } from "./02-routing";
import { parallelCode } from "./03-parallel";
import { orchestratorCode } from "./04-orchestrator";
import { evaluatorCode } from "./05-evaluator";
import { useAgent } from "agents/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Play,
  Square,
  Sparkles,
  FileText,
  Code,
  Globe,
  Settings,
  Zap,
} from "lucide-react";
import { toast as showToast } from "sonner";
import PageBanner from "@/components/page-banner";
import { OutputDisplay } from "@/components/output-display";

type WorkflowStatus = {
  isRunning: boolean;
  output: string;
};

type WorkflowType =
  | "sequential"
  | "routing"
  | "parallel"
  | "orchestrator"
  | "evaluator";

type PatternProps = {
  type: WorkflowType;
  title: string;
  description: string;
  index: number;
};

type FormState = {
  sequential: { input: string };
  routing: { query: string };
  parallel: { code: string };
  orchestrator: { featureRequest: string };
  evaluator: { text: string; targetLanguage: string };
};

const LANGUAGES = [
  { label: "French", value: "french" },
  { label: "Spanish", value: "spanish" },
  { label: "Japanese", value: "japanese" },
  { label: "German", value: "german" },
  { label: "Mandarin Chinese", value: "mandarin" },
  { label: "Arabic", value: "arabic" },
  { label: "Russian", value: "russian" },
  { label: "Italian", value: "italian" },
  { label: "Klingon", value: "klingon" },
  { label: "Portuguese", value: "portuguese" },
] as const;

function getOrCreateSessionId() {
  const stored = globalThis.localStorage?.getItem("sessionId");
  if (stored) return stored;

  const newId = nanoid(8);
  globalThis.localStorage?.setItem("sessionId", newId);
  return newId;
}

function PatternSection({
  type,
  title,
  description,
  index,
  sessionId,
}: PatternProps & { sessionId: string }) {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    isRunning: false,
    output: "",
  });

  const [copiedText, setCopiedText] = useState("");

  const [formState, setFormState] = useState<FormState[typeof type]>(() => {
    switch (type) {
      case "sequential":
        return { input: "Our new AI-powered productivity app" };
      case "routing":
        return { query: "How do I reset my password?" };
      case "parallel":
        return {
          code: `function processUserData(data) {
  // TODO: Add validation
  database.save(data);
  return true;
}`,
        };
      case "orchestrator":
        return {
          featureRequest:
            "Add dark mode support to the dashboard, including theme persistence and system preference detection",
        };
      case "evaluator":
        return {
          targetLanguage: LANGUAGES[0].value,
          text: "The early bird catches the worm",
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
      case "sequential":
        return <Sparkles className="h-4 w-4" />;
      case "routing":
        return <Settings className="h-4 w-4" />;
      case "parallel":
        return <Code className="h-4 w-4" />;
      case "orchestrator":
        return <Zap className="h-4 w-4" />;
      case "evaluator":
        return <Globe className="h-4 w-4" />;
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
    if (type === "sequential") {
      const state = formState as FormState["sequential"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label htmlFor="sequential-input" className="font-medium">
                Marketing Copy Input
              </Label>
            </div>
            <Input
              id="sequential-input"
              type="text"
              name="input"
              value={state.input}
              onChange={handleInputChange}
              placeholder="e.g., 'Our new AI-powered productivity app'"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Enter a product or service to generate marketing copy for
            </p>
          </div>
        </Card>
      );
    }

    if (type === "routing") {
      const state = formState as FormState["routing"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <Label htmlFor="routing-query" className="font-medium">
                Customer Query
              </Label>
            </div>
            <Input
              id="routing-query"
              type="text"
              name="query"
              value={state.query}
              onChange={handleInputChange}
              placeholder="e.g., 'How do I reset my password?'"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Enter a customer support question to be routed
            </p>
          </div>
        </Card>
      );
    }

    if (type === "parallel") {
      const state = formState as FormState["parallel"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <Label htmlFor="parallel-code" className="font-medium">
                Code for Review
              </Label>
            </div>
            <Textarea
              id="parallel-code"
              name="code"
              value={state.code}
              onChange={handleInputChange}
              placeholder={
                "e.g.,\nfunction processUserData(data) {\n  // TODO: Add validation\n  database.save(data);\n  return true;\n}"
              }
              rows={6}
              className="bg-background font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Enter code snippet for parallel security, performance, and
              maintainability review
            </p>
          </div>
        </Card>
      );
    }

    if (type === "orchestrator") {
      const state = formState as FormState["orchestrator"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <Label htmlFor="orchestrator-request" className="font-medium">
                Feature Request
              </Label>
            </div>
            <Textarea
              id="orchestrator-request"
              name="featureRequest"
              value={state.featureRequest}
              onChange={handleInputChange}
              placeholder="e.g., 'Add dark mode support to the dashboard, including theme persistence and system preference detection'"
              rows={4}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Describe the feature to be implemented across multiple files
            </p>
          </div>
        </Card>
      );
    }

    if (type === "evaluator") {
      const state = formState as FormState["evaluator"];
      return (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label htmlFor="evaluator-text" className="font-medium">
                  Text to Translate
                </Label>
              </div>
              <Textarea
                id="evaluator-text"
                name="text"
                value={state.text}
                onChange={handleInputChange}
                placeholder="e.g., 'The early bird catches the worm'"
                rows={3}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Enter text to be translated and optimized
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="evaluator-language" className="font-medium">
                Target Language
              </Label>
              <Select
                value={state.targetLanguage}
                onValueChange={(value) => {
                  setFormState((prev) => ({ ...prev, targetLanguage: value }));
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Select the language to translate into
              </p>
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
      // Show success toast when workflow starts
      showToast.info(`Started ${title} workflow...`);
    } catch {
      // Show error toast if something goes wrong
      showToast.error(`Failed to start ${title} workflow`);
    }
  };

  return (
    <Card className="pb-6 !border-b-1 !border-t-0 !border-l-0 !border-r-0 !rounded-none !shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">{index + 1}</Badge>
              {title}
            </CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                  showToast.info(`Stopping ${title} workflow...`);
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
                <Label className="text-sm font-medium">Generated Output</Label>
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
                    Enter input above and click &apos;Run&apos; to see {title}{" "}
                    in action
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  useEffect(() => {
    // Add toast event listener for agents
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
    evaluator: {
      code: evaluatorCode,
      description:
        "One LLM generates responses while another provides evaluation and feedback in a loop.",
      title: "Evaluator-Optimizer",
    },
    orchestrator: {
      code: orchestratorCode,
      description:
        "A central LLM dynamically breaks down tasks, delegates to worker LLMs, and synthesizes results.",
      title: "Orchestrator-Workers",
    },
    parallel: {
      code: parallelCode,
      description:
        "Enables simultaneous task processing through sectioning or voting mechanisms.",
      title: "Parallelization",
    },
    routing: {
      code: routingCode,
      description:
        "Classifies input and directs it to specialized followup tasks, allowing for separation of concerns.",
      title: "Routing",
    },
    sequential: {
      code: sequentialCode,
      description:
        "Decomposes tasks into a sequence of steps, where each LLM call processes the output of the previous one.",
      title: "Prompt Chaining",
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
            href: "/dashboard/agents",
            label: "Agents",
          },
        ]}
      />
      <PageBanner
        bannerDescription="Leverage recursive workflows to create content, automate tasks, and more."
        bannerTitle="Agents"
      />
      <div className="container">
        <main>
          {(
            Object.entries(patterns) as [
              WorkflowType,
              (typeof patterns)[keyof typeof patterns]
            ][]
          ).map(([type, pattern], index) => (
            <PatternSection
              key={type}
              type={type}
              title={pattern.title}
              description={pattern.description}
              index={index}
              sessionId={sessionId}
            />
          ))}
        </main>
      </div>
    </>
  );
}
