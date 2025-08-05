"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

export type SortBy = 'name' | 'size' | 'date' | 'type';
export type SortOrder = 'asc' | 'desc';

interface R2SortControlsProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (sortOrder: SortOrder) => void;
  disabled?: boolean;
}

const sortOptions = [
  { value: 'name' as const, label: 'Name' },
  { value: 'size' as const, label: 'Size' },
  { value: 'date' as const, label: 'Date Modified' },
  { value: 'type' as const, label: 'Type' },
];

export function R2SortControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  disabled = false,
}: R2SortControlsProps) {
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Sort by:</span>
      
      <Select
        value={sortBy}
        onValueChange={(value: SortBy) => onSortByChange(value)}
        disabled={disabled}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleSortOrder}
        disabled={disabled}
        className="p-2"
      >
        {sortOrder === 'asc' ? (
          <ArrowUpIcon className="h-4 w-4" />
        ) : (
          <ArrowDownIcon className="h-4 w-4" />
        )}
        <span className="sr-only">
          Sort {sortOrder === 'asc' ? 'ascending' : 'descending'}
        </span>
      </Button>
    </div>
  );
}