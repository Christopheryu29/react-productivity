"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { labels } from "../data/data";
import { taskSchema } from "../data/schema";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@chakra-ui/react";

interface Task {
  id: Id<"task">; // Convex's Id<"task"> type
  title: string;
  status: string;
  label: string;
  priority: string;
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}
export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original); // Assuming row.original has 'id'
  const deleteTask = useMutation(api.task.deleteTask);
  const toast = useToast();

  // Change the type here to string since you're using 'id' as a string
  const handleDelete = async (id: string) => {
    try {
      // Convex expects 'Id<"task">' so you can cast 'id' here
      await deleteTask({ id: id as unknown as Id<"task"> });
      toast({
        title: "Task deleted.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to delete task:", error.message);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDelete(task.id)}>
          {" "}
          {/* Use task.id here */}
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
