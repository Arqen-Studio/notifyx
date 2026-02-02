"use client";

import { useEffect, useState, useRef } from "react";
import { MoreVertical } from "lucide-react";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  ariaLabel?: string;
}

export function ActionMenu({ items, ariaLabel = "Actions" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick();
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        className="p-2 rounded hover:bg-slate-100 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-label={ariaLabel}
        type="button"
      >
        <MoreVertical size={18} className="text-gray-600" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col py-1 z-50 min-w-[140px] right-0 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => (
            <button
              key={index}
              className={`px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm w-full text-left transition-colors ${
                item.variant === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
