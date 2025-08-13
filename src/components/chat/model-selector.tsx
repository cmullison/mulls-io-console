"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chatModels } from "@/lib/ai/models";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const groupedModels = {
    anthropic: chatModels.filter((m) => m.provider === "anthropic"),
    openai: chatModels.filter((m) => m.provider === "openai"),
    google: chatModels.filter((m) => m.provider === "google"),
  };

  return (
    <Select
      value={selectedModel}
      onValueChange={onModelChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Anthropic
        </div>
        {groupedModels.anthropic.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{model.name}</span>
            </div>
          </SelectItem>
        ))}

        <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">
          OpenAI
        </div>
        {groupedModels.openai.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{model.name}</span>
            </div>
          </SelectItem>
        ))}

        <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">
          Google
        </div>
        {groupedModels.google.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{model.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
