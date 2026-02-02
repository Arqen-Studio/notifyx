"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagInput({ tags, onTagsChange }: TagInputProps) {
  const handleAddTag = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onTagsChange([...tags, trimmedValue]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
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
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded-full bg-slate-100 flex items-center gap-1"
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
          ))}
        </div>
      )}
    </div>
  );
}
