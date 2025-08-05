"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Zap, FileText, Code, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type WorkflowType =
  | "sequential"
  | "routing"
  | "parallel"
  | "orchestrator"
  | "evaluator"
  | "sequentialBuilder"
  | "parallelSections"
  | "orchestratorCreator"
  | "evaluatorOptimizer";

interface OutputDisplayProps {
  output: any;
  onCopy: (text: string) => void;
  copiedText: string;
  type: WorkflowType;
}

// Helper function to detect if text contains markdown
const hasMarkdown = (text: string): boolean => {
  const markdownPatterns = [
    /\*\*[\s\S]*?\*\*/, // Bold **text**
    /\*[\s\S]*?\*/, // Italic *text*
    /^#{1,6}\s/m, // Headers # ## ###
    /^\*\s/m, // Bullet points * item
    /^-\s/m, // Bullet points - item
    /^\d+\.\s/m, // Numbered lists 1. item
    /\[[\s\S]*?\]\([\s\S]*?\)/, // Links [text](url)
    /`[\s\S]*?`/, // Inline code `code`
    /```[\s\S]*?```/, // Code blocks ```code```
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
};

// Markdown-aware text renderer
const MarkdownText = ({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) => {
  if (hasMarkdown(content)) {
    return (
      <ReactMarkdown
        // @ts-expect-error - react-markdown types are not compatible with React 19
        className={cn("prose prose-sm max-w-none", className)}
        components={{
          // Custom styling for markdown elements
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return <div className={cn("leading-relaxed", className)}>{content}</div>;
};

export function OutputDisplay({
  output,
  onCopy,
  copiedText,
  type,
}: OutputDisplayProps) {
  // Special handling for Orchestrator output (file changes)
  if (type === "orchestrator" && output.changes) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <Label className="font-medium">Implementation Plan</Label>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Complexity:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    output.plan?.estimatedComplexity === "high"
                      ? "border-red-200 text-red-700"
                      : output.plan?.estimatedComplexity === "medium"
                      ? "border-yellow-200 text-yellow-700"
                      : "border-green-200 text-green-700"
                  )}
                >
                  {output.plan?.estimatedComplexity || "Unknown"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Files:</span>
                <Badge variant="secondary">
                  {output.plan?.files?.length || 0} files
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Label className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            File Changes
          </Label>
          {output.changes?.map((change: any, index: number) => (
            <Card key={index} className="p-4 bg-muted/20">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        change.file?.changeType === "create"
                          ? "border-green-200 text-green-700"
                          : change.file?.changeType === "modify"
                          ? "border-blue-200 text-blue-700"
                          : "border-red-200 text-red-700"
                      )}
                    >
                      {change.file?.changeType}
                    </Badge>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {change.file?.filePath}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(change.implementation?.code || "")}
                    className="h-6 px-2 text-xs"
                  >
                    {copiedText === change.implementation?.code ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {change.file?.purpose}
                </p>
                {change.implementation?.explanation && (
                  <p className="text-sm">{change.implementation.explanation}</p>
                )}
                {change.implementation?.code && (
                  <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-x-auto">
                    <code>{change.implementation.code}</code>
                  </pre>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Special handling for Parallel output (code reviews)
  if (type === "parallel" && output.reviews) {
    return (
      <div className="space-y-4">
        {output.summary && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Executive Summary
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(output.summary)}
                  className="h-6 px-2 text-xs"
                >
                  {copiedText === output.summary ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="bg-muted/50 p-3 rounded-md text-sm">
                <MarkdownText content={output.summary} />
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <Label className="font-medium flex items-center gap-2">
            <Code className="h-4 w-4" />
            Detailed Reviews
          </Label>
          {output.reviews?.map((review: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      review.type === "security"
                        ? "border-red-200 text-red-700"
                        : review.type === "performance"
                        ? "border-yellow-200 text-yellow-700"
                        : "border-blue-200 text-blue-700"
                    )}
                  >
                    {review.type} Review
                  </Badge>
                  {(review.riskLevel ||
                    review.impact ||
                    review.qualityScore) && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        review.riskLevel === "high" ||
                          review.impact === "high" ||
                          review.qualityScore < 7
                          ? "bg-red-100 text-red-800"
                          : review.riskLevel === "medium" ||
                            review.impact === "medium" ||
                            review.qualityScore < 8
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      )}
                    >
                      {review.riskLevel ||
                        review.impact ||
                        `Score: ${review.qualityScore}/10`}
                    </Badge>
                  )}
                </div>

                {(review.vulnerabilities?.length > 0 ||
                  review.issues?.length > 0 ||
                  review.concerns?.length > 0) && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-red-600 uppercase">
                      Issues Found
                    </Label>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <ul className="text-sm space-y-1">
                        {(
                          review.vulnerabilities ||
                          review.issues ||
                          review.concerns ||
                          []
                        ).map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500 text-xs mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {(review.suggestions?.length > 0 ||
                  review.optimizations?.length > 0 ||
                  review.recommendations?.length > 0) && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-blue-600 uppercase">
                      Recommendations
                    </Label>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <ul className="text-sm space-y-1">
                        {(
                          review.suggestions ||
                          review.optimizations ||
                          review.recommendations ||
                          []
                        ).map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 text-xs mt-1">
                              •
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Default rendering for other types or simple outputs
  const renderValue = (key: string, value: any) => {
    if (typeof value === "string") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              {key}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(value)}
              className="h-6 px-2 text-xs"
            >
              {copiedText === value ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <MarkdownText content={value} />
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              {key} ({value.length} items)
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(JSON.stringify(value, null, 2))}
              className="h-6 px-2 text-xs"
            >
              {copiedText === JSON.stringify(value, null, 2) ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="space-y-2">
            {value.map((item, index) => (
              <Card key={index} className="p-3 bg-muted/30">
                {typeof item === "object" && item !== null ? (
                  <div className="space-y-2">
                    {Object.entries(item).map(([itemKey, itemValue]) => (
                      <div key={itemKey} className="text-sm">
                        <span className="font-medium text-muted-foreground">
                          {itemKey}:
                        </span>
                        <div className="mt-1 text-foreground">
                          {typeof itemValue === "string" ? (
                            <MarkdownText content={itemValue} />
                          ) : (
                            <span className="px-2 py-1 bg-muted rounded text-xs">
                              {String(itemValue)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">
                    <MarkdownText content={String(item)} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              {key}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(JSON.stringify(value, null, 2))}
              className="h-6 px-2 text-xs"
            >
              {copiedText === JSON.stringify(value, null, 2) ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Card className="p-3 bg-muted/30">
            <div className="space-y-2">
              {Object.entries(value).map(([subKey, subValue]) => (
                <div key={subKey} className="text-sm">
                  <span className="font-medium text-muted-foreground">
                    {subKey}:
                  </span>
                  <div className="mt-1">
                    {typeof subValue === "string" ? (
                      <MarkdownText content={subValue} />
                    ) : Array.isArray(subValue) ? (
                      <div className="space-y-1">
                        {subValue.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-muted/50 p-2 rounded text-xs"
                          >
                            {typeof item === "object" ? (
                              <div className="space-y-1">
                                {Object.entries(item).map(([k, v]) => (
                                  <div key={k}>
                                    <span className="font-medium">{k}:</span>{" "}
                                    {String(v)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <MarkdownText content={String(item)} />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : typeof subValue === "object" && subValue !== null ? (
                      <div className="bg-muted/50 p-2 rounded text-xs space-y-1">
                        {Object.entries(subValue).map(([k, v]) => (
                          <div key={k}>
                            <span className="font-medium">{k}:</span>{" "}
                            {String(v)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {String(subValue)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase">
          {key}
        </Label>
        <div className="bg-muted/50 p-3 rounded-md text-sm">
          {String(value)}
        </div>
      </div>
    );
  };

  if (output.text && Object.keys(output).length === 1) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              Result
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(output.text)}
              className="h-6 px-2 text-xs"
            >
              {copiedText === output.text ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="bg-muted/50 p-4 rounded-md text-sm">
            <MarkdownText content={output.text} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(output).map(([key, value]) => (
        <Card key={key} className="p-4">
          {renderValue(key, value)}
        </Card>
      ))}
    </div>
  );
}
