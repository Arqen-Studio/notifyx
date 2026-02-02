"use client";

interface FilterState {
  status: string;
  tagId: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface DashboardFiltersProps {
  filters: FilterState;
  allTags: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: FilterState) => void;
}

export function DashboardFilters({ filters, allTags, onFiltersChange }: DashboardFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleTagChange = (value: string) => {
    onFiltersChange({ ...filters, tagId: value });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f] text-sm"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-3">
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f] text-sm min-w-[120px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.tagId}
            onChange={(e) => handleTagChange(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f] text-sm min-w-[120px]"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full sm:w-auto">
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full sm:w-auto px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f] text-sm"
        >
          <option value="deadline-asc">Deadline: Soonest First</option>
          <option value="deadline-desc">Deadline: Latest First</option>
          <option value="created-desc">Newest First</option>
          <option value="created-asc">Oldest First</option>
        </select>
      </div>
    </div>
  );
}
