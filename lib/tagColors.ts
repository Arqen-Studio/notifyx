/**
 * Returns the color classes for a given tag name
 * @param tagName - The name of the tag
 * @returns Tailwind CSS classes for background, text, and border colors
 */
export function getTagColors(tagName: string): string {
  const tagColors: Record<string, string> = {
    "Urgent": "bg-red-300 text-red-900 border-red-800",
    "Important": "bg-orange-300 text-orange-900 border-orange-300",
    "Low Priority": "bg-yellow-300 text-yellow-700 border-yellow-300",
    "Pending": "bg-blue-300 text-blue-700 border-blue-300",
    "In Progress": "bg-purple-300 text-purple-700 border-purple-300",
    "Completed": "bg-green-500 text-green-800 border-green-800",
    "Follow-up Needed": "bg-teal-300 text-teal-900 border-teal-300",
  };

  return tagColors[tagName] || "bg-slate-100 text-slate-700 border-slate-300";
}
