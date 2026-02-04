"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertCircle } from "lucide-react";
import { getTagColors } from "@/lib/tagColors";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

const PREDEFINED_TAGS = [
  "Urgent",
  "Important",
  "Low Priority",
  "Pending",
  "In Progress",
  "Completed",
  "Follow-up Needed",
];

const CONFLICTING_TAGS: Record<string, string[]> = {
  "Completed": ["Pending", "In Progress"],
  "Pending": ["Completed"],
  "In Progress": ["Completed"],
  "Urgent": ["Low Priority"],
  "Low Priority": ["Urgent"],
};

export function TagInput({ tags, onTagsChange }: TagInputProps) {
  const [error, setError] = useState<string | null>(null);

  const checkConflicts = (newTag: string, currentTags: string[]): string | null => {
    const conflictingTags = CONFLICTING_TAGS[newTag] || [];
    const conflictTag = conflictingTags.find((tag) => currentTags.includes(tag));
    
    if (conflictTag) {
      return `Cannot use '${newTag}' and '${conflictTag}' tags together`;
    }
    return null;
  };

  const handleAddTag = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      const conflictError = checkConflicts(trimmedValue, tags);
      if (conflictError) {
        setError(conflictError);
        setTimeout(() => setError(null), 3000);
        return;
      }
      setError(null);
      onTagsChange([...tags, trimmedValue]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setError(null);
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTogglePredefinedTag = (tag: string) => {
    if (tags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      handleAddTag(tag);
    }
  };

  const isTagDisabled = (tag: string): boolean => {
    if (tags.includes(tag)) return false;
    const conflictingTags = CONFLICTING_TAGS[tag] || [];
    return conflictingTags.some((conflictTag) => tags.includes(conflictTag));
  };

  return (
    <div className="space-y-2">
      <Label>Priority & Tags</Label>
      <Input
        placeholder="Type and press enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
      
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-2">
        <Label className="text-xs text-slate-500 font-normal">Suggested Tags</Label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => {
            const isSelected = tags.includes(tag);
            const isDisabled = isTagDisabled(tag);
            const tagColorClasses = getTagColors(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTogglePredefinedTag(tag)}
                disabled={isDisabled}
                className={`px-2 py-1 text-xs rounded-full transition-colors border ${
                  isSelected
                    ? tagColorClasses
                    : isDisabled
                    ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                title={isDisabled ? `Cannot use '${tag}' with conflicting tags` : undefined}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs text-slate-500 font-normal">Selected Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const tagColorClasses = getTagColors(tag);
              return (
                <span
                  key={tag}
                  className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 border whitespace-nowrap ${tagColorClasses}`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600 transition-colors"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
