"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const filterControls = (
    <>
      <Input
        placeholder="Search by title..."
        value={searchInput}
        onChange={(event) => handleSearchChange(event.target.value)}
        className="w-full lg:max-w-56 lg:flex-1"
      />

      <NativeSelect
        aria-label="Filter by status"
        className="w-full lg:w-fit"
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
        className="w-full lg:w-fit"
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
          className="w-full lg:w-fit"
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
        className="w-full lg:w-fit"
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
    </>
  );

  return (
    <>
      {/* Desktop: full inline row. Below `lg`, the row of five controls
          doesn't fit without awkward wrapping, so it collapses into a
          single "Filters" button + sheet instead (design-prompt.md's
          responsive behavior section). */}
      <div className="hidden items-center gap-2 lg:flex">{filterControls}</div>

      <div className="flex lg:hidden">
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal />
          Filters
        </Button>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="flex flex-col gap-3 p-4">
          <SheetHeader className="p-0">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          {filterControls}
        </SheetContent>
      </Sheet>
    </>
  );
}
