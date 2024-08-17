// app/(main)/(routes)/todo/page.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

function TodoApp() {
  const [newTodo, setNewTodo] = useState("");

  const todos = useQuery(api.todo.getTodos);
  const createTodo = useMutation(api.todo.createTodo);
  const toggleTodo = useMutation(api.todo.toggleTodo);
  const deleteTodo = useMutation(api.todo.deleteTodo);

  const handleAddTodo = async () => {
    if (newTodo.trim() !== "") {
      await createTodo({ text: newTodo });
      setNewTodo("");
    }
  };

  const handleToggleTodo = async (id: string, isCompleted: boolean) => {
    const todoId = id as unknown as Id<"todos">;
    await toggleTodo({ id: todoId, isCompleted: !isCompleted });
  };

  const handleDeleteTodo = async (id: string) => {
    const todoId = id as unknown as Id<"todos">;
    await deleteTodo({ id: todoId });
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="flex justify-center items-center">
        <h1 className="text-3xl text-blue-500 mb-4">Todo List</h1>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 p-2 text-lg border rounded border-gray-300"
          placeholder="Add new todo"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <button
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          onClick={handleAddTodo}
        >
          Add
        </button>
      </div>
      {todos && todos.length > 0 ? (
        todos.map((todo) => (
          <div
            key={todo._id}
            className="flex items-center my-2 p-2 shadow rounded-md"
          >
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={() => handleToggleTodo(todo._id, todo.isCompleted)}
              className="mr-4"
            />
            <span
              className={`flex-1 ${todo.isCompleted ? "line-through" : ""}`}
            >
              {todo.text}
            </span>
            <button
              className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
              onClick={() => handleDeleteTodo(todo._id)}
            >
              Delete
            </button>
          </div>
        ))
      ) : (
        <p className="mt-4">No todos found. Add some!</p>
      )}
    </div>
  );
}

export default TodoApp;
