"use client";

import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useController, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createTag, deleteTag, fetchTags, tagKeys } from "@/lib/tags";
import type { Tag } from "@/lib/tasks";
import { createTask, taskKeys, updateTask } from "@/lib/tasks";
import type { Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().min(1, { error: "Title is required." }),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.string().optional(),
  tagIds: z.array(z.string()),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const emptyValues: TaskFormValues = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  tagIds: [],
};

function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    tagIds: task.tags.map((tag) => tag.id),
  };
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new task; pass an existing task to edit it. */
  task?: Task;
}

export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Full-screen below `sm` (design-prompt.md's responsive behavior
          section calls for the create/edit form going full-screen on
          mobile), a normal centered modal from `sm` up. */}
      <DialogContent className="max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none sm:max-w-md">
        {/*
          Keyed by open + task id so the form remounts (and re-reads
          defaultValues) fresh every time the dialog opens, instead of
          reusing a stale useForm instance from a previous open/task —
          React's recommended alternative to syncing state via an effect.
        */}
        <TaskForm
          key={open ? (task?.id ?? "create") : "closed"}
          task={task}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({
  task,
  onOpenChange,
}: {
  task?: Task;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!task;
  const [formError, setFormError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagPendingDelete, setTagPendingDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tags, isPending: tagsPending } = useQuery({
    queryKey: tagKeys.list(),
    queryFn: fetchTags,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: standardSchemaResolver(taskSchema),
    defaultValues: task ? taskToFormValues(task) : emptyValues,
  });

  const { field: tagIdsField } = useController({ name: "tagIds", control });

  const mutation = useMutation({
    mutationFn: (values: TaskFormValues) => {
      const input = {
        title: values.title,
        description: values.description?.trim() || null,
        status: values.status,
        priority: values.priority,
        // <input type="date"> yields a bare "YYYY-MM-DD"; Prisma's client
        // requires a full ISO-8601 datetime (a bare date passes the API's
        // class-validator check but throws at the Prisma layer), so it's
        // expanded to midnight UTC here. `null` explicitly clears the due
        // date on edit rather than leaving a stale value untouched.
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        tagIds: values.tagIds,
      };
      return isEdit ? updateTask(task.id, input) : createTask(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      onOpenChange(false);
      toast.success(isEdit ? "Task updated" : "Task created");
    },
  });

  async function onSubmit(values: TaskFormValues) {
    setFormError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save task.");
    }
  }

  function toggleTag(tagId: string) {
    const current = tagIdsField.value;
    tagIdsField.onChange(
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: (tag) => {
      // Append the new tag straight into the cache so it shows up as a
      // chip immediately, rather than waiting on a refetch.
      queryClient.setQueryData<Tag[]>(tagKeys.list(), (old) =>
        old ? [...old, tag] : [tag],
      );
      tagIdsField.onChange([...tagIdsField.value, tag.id]);
      setNewTagName("");
      setTagError(null);
      toast.success(`Tag "${tag.name}" created`);
    },
    onError: (error) => {
      setTagError(error instanceof Error ? error.message : "Failed to create tag.");
    },
  });

  function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;
    setTagError(null);
    createTagMutation.mutate(name);
  }

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: (_data, tagId) => {
      const deletedTagName = tags?.find((t) => t.id === tagId)?.name;
      queryClient.setQueryData<Tag[]>(tagKeys.list(), (old) =>
        old?.filter((t) => t.id !== tagId),
      );
      // The tag might be selected on the task currently being edited —
      // drop it from the in-progress selection too.
      if (tagIdsField.value.includes(tagId)) {
        tagIdsField.onChange(tagIdsField.value.filter((id) => id !== tagId));
      }
      // Other tasks may show this tag as a chip in the list — refresh them
      // now that the tag (and its task associations) are gone server-side.
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      setTagPendingDelete(null);
      toast.success(deletedTagName ? `Tag "${deletedTagName}" deleted` : "Tag deleted");
    },
    onError: (error) => {
      setTagError(error instanceof Error ? error.message : "Failed to delete tag.");
      setTagPendingDelete(null);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Update the details of this task." : "Add a task to your list."}
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={handleSubmit(onSubmit, () => setFormError(null))}
        noValidate
        className="flex flex-col gap-4"
      >
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <NativeSelect id="status" {...register("status")}>
              <NativeSelectOption value="TODO">To do</NativeSelectOption>
              <NativeSelectOption value="IN_PROGRESS">
                In progress
              </NativeSelectOption>
              <NativeSelectOption value="DONE">Done</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priority">Priority</Label>
            <NativeSelect id="priority" {...register("priority")}>
              <NativeSelectOption value="LOW">Low</NativeSelectOption>
              <NativeSelectOption value="MEDIUM">Medium</NativeSelectOption>
              <NativeSelectOption value="HIGH">High</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tags</Label>
          {tagsPending && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                if (tagPendingDelete === tag.id) {
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
                    >
                      Delete &quot;{tag.name}&quot;?
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => deleteTagMutation.mutate(tag.id)}
                        disabled={deleteTagMutation.isPending}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:underline"
                        onClick={() => setTagPendingDelete(null)}
                        disabled={deleteTagMutation.isPending}
                      >
                        No
                      </button>
                    </span>
                  );
                }

                const selected = tagIdsField.value.includes(tag.id);
                return (
                  <span
                    key={tag.id}
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full border py-1 pl-2.5 pr-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete tag "${tag.name}"`}
                      onClick={() => setTagPendingDelete(tag.id)}
                      className={cn(
                        "rounded-full p-0.5",
                        selected
                          ? "hover:bg-primary-foreground/20"
                          : "hover:bg-foreground/10",
                      )}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateTag();
                }
              }}
              placeholder="New tag name"
              className="h-7 max-w-40 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTagMutation.isPending}
            >
              <Plus />
              {createTagMutation.isPending ? "Adding..." : "Add tag"}
            </Button>
          </div>
          {tagError && <p className="text-sm text-destructive">{tagError}</p>}
        </div>

        <DialogFooter className="max-sm:rounded-b-none">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save changes"
                : "Create task"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
