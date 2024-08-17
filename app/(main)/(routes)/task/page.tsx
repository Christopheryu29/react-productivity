// task/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "./components/data-table";
import { UserNav } from "./components/user-nav";
import { columns } from "./components/columns";

interface Task {
  id: string;
  title: string;
  status: string;
  label: string;
  priority: string;
}

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("backlog");
  const [label, setLabel] = useState("bug");
  const [priority, setPriority] = useState("low");

  const fetchedTasks = useQuery(api.tasks.getTasks);
  const createTaskMutation = useMutation(api.tasks.createTask);

  useEffect(() => {
    if (fetchedTasks) {
      setTasks(fetchedTasks);
      setLoading(false);
    }
  }, [fetchedTasks]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createTaskMutation({
        id: crypto.randomUUID(),
        title,
        status,
        label,
        priority,
      });
      setTitle("");
      setStatus("backlog"); // Reset to default value
      setLabel("bug"); // Reset to default value
      setPriority("low"); // Reset to default value
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  if (loading) return <p>Loading tasks...</p>;

  return (
    <div className="task-page">
      <div className="user-nav">
        <UserNav />
      </div>
      <form onSubmit={handleSubmit} className="task-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="backlog">Backlog</option>
          <option value="todo">Todo</option>
          <option value="in progress">In Progress</option>
          <option value="done">Done</option>
          <option value="canceled">Canceled</option>
        </select>
        <select value={label} onChange={(e) => setLabel(e.target.value)}>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="documentation">Documentation</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Add Task</button>
      </form>
      <DataTable data={tasks} columns={columns} />
    </div>
  );
};

export default TaskPage;
