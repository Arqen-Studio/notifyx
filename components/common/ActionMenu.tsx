"use client";

import { useEffect, useState, useRef } from "react";
import { MoreVertical } from "lucide-react";

export interface ActionMenuItem {
  label?: string;
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
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        className="p-2 rounded hover:bg-slate-100 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label={ariaLabel}
        type="button"
      >
        <MoreVertical size={18} className="text-gray-600" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`absolute bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col z-50 right-0 bottom-full mb-1 ${
            items.some((item) => item.label) 
              ? "min-w-[140px] py-1" 
              : "w-auto py-1"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => (
            <button
              key={index}
              className={`${
                item.label ? "px-4 py-2" : "p-2.5"
              } hover:bg-gray-50 flex items-center ${
                item.label ? "justify-start gap-2" : "justify-center"
              } text-sm w-full transition-colors ${
                item.variant === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleItemClick(item);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              type="button"
              aria-label={item.label || (item.variant === "danger" ? "Delete" : "Edit")}
            >
              {item.icon}
              {item.label && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
