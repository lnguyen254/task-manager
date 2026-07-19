"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { fetchTags, tagKeys } from "@/lib/tags";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "dueDate:asc", label: "Due date" },
  { value: "priority:desc", label: "Priority (high to low)" },
  { value: "title:asc", label: "Title (A–Z)" },
] as const;

const SEARCH_DEBOUNCE_MS = 300;

export function TaskFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: tags } = useQuery({ queryKey: tagKeys.list(), queryFn: fetchTags });

  const searchParam = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchParam);
  const [syncedSearchParam, setSyncedSearchParam] = useState(searchParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The URL's `search` param can change for a reason other than this
  // component's own debounced commit below — e.g. the "Clear filters"
  // button in TaskList resetting the whole query string. When that
  // happens, re-sync the input's displayed value to match. Adjusting
  // state during render (guarded so it only fires once per actual change)
  // is React's documented alternative to an effect for this exact case.
  if (searchParam !== syncedSearchParam) {
    setSyncedSearchParam(searchParam);
    setSearchInput(searchParam);
  }

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || undefined });
    }, SEARCH_DEBOUNCE_MS);
  }

  const sortValue = `${searchParams.get("sortBy") ?? "createdAt"}:${
    searchParams.get("sortOrder") ?? "desc"
  }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search by title..."
        value={searchInput}
        onChange={(event) => handleSearchChange(event.target.value)}
        className="max-w-56 flex-1"
      />

      <NativeSelect
        aria-label="Filter by status"
        value={searchParams.get("status") ?? ""}
        onChange={(event) =>
          updateParams({ status: event.target.value || undefined })
        }
      >
        <NativeSelectOption value="">All statuses</NativeSelectOption>
        <NativeSelectOption value="TODO">To do</NativeSelectOption>
        <NativeSelectOption value="IN_PROGRESS">In progress</NativeSelectOption>
        <NativeSelectOption value="DONE">Done</NativeSelectOption>
      </NativeSelect>

      <NativeSelect
        aria-label="Filter by priority"
        value={searchParams.get("priority") ?? ""}
        onChange={(event) =>
          updateParams({ priority: event.target.value || undefined })
        }
      >
        <NativeSelectOption value="">All priorities</NativeSelectOption>
        <NativeSelectOption value="LOW">Low</NativeSelectOption>
        <NativeSelectOption value="MEDIUM">Medium</NativeSelectOption>
        <NativeSelectOption value="HIGH">High</NativeSelectOption>
      </NativeSelect>

      {tags && tags.length > 0 && (
        <NativeSelect
          aria-label="Filter by tag"
          value={searchParams.get("tagId") ?? ""}
          onChange={(event) =>
            updateParams({ tagId: event.target.value || undefined })
          }
        >
          <NativeSelectOption value="">All tags</NativeSelectOption>
          {tags.map((tag) => (
            <NativeSelectOption key={tag.id} value={tag.id}>
              {tag.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      <NativeSelect
        aria-label="Sort tasks"
        value={sortValue}
        onChange={(event) => {
          const [sortBy, sortOrder] = event.target.value.split(":");
          updateParams({ sortBy, sortOrder });
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
