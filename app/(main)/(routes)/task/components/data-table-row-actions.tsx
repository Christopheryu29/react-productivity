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
import { useState } from "react";
import {
  useToast,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";

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
  const updateTask = useMutation(api.task.updateTask);
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false); // State to control editing mode
  const [editedTask, setEditedTask] = useState(task); // Hold the values being edited
  const handleEditClick = () => {
    setIsEditing(true); // Show the modal for editing
  };

  const handleUpdateTask = async () => {
    try {
      await updateTask({
        id: editedTask.id as unknown as Id<"task">,
        title: editedTask.title,
        status: editedTask.status,
        label: editedTask.label,
        priority: editedTask.priority,
      });
      toast({
        title: "Task updated.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setIsEditing(false); // Close the modal after saving
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

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
    <>
      {/* Dropdown Menu for Edit/Delete */}
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
          <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDelete(task.id)}>
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal for Editing Task */}
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Task</ModalHeader>
            <ModalBody>
              <Input
                placeholder="Title"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
              />
              <Select
                value={editedTask.status}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, status: e.target.value })
                }
              >
                <option value="backlog">Backlog</option>
                <option value="todo">Todo</option>
                <option value="in progress">In Progress</option>
                <option value="done">Done</option>
                <option value="canceled">Canceled</option>
              </Select>
              <Select
                value={editedTask.label}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, label: e.target.value })
                }
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="documentation">Documentation</option>
              </Select>
              <Select
                value={editedTask.priority}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button onClick={handleUpdateTask}>Save</Button>
              <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
