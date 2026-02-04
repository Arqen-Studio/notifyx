"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { ActionMenu, ActionMenuItem } from "@/components/common/ActionMenu";

interface TaskActionMenuProps {
  taskId: string;
  onDelete: () => void;
  onEdit?: () => void;
}

export function TaskActionMenu({ taskId, onDelete, onEdit }: TaskActionMenuProps) {
  const router = useRouter();

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      router.push(`/tasks/edit/${taskId}`);
    }
  };

  const menuItems: ActionMenuItem[] = [
    {
      icon: <Edit size={16} className="text-blue-500" />,
      onClick: handleEdit,
    },
    {
      icon: <Trash2 size={16} />,
      onClick: onDelete,
      variant: "danger",
    },
  ];

  return <ActionMenu items={menuItems} ariaLabel="Task actions" />;
}
