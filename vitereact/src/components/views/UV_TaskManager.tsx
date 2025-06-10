import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";
import { Link } from "react-router-dom";

interface Task {
  task_id: string;
  title: string;
  description: string;
  deadline: string;
  priority: number;
  status: string;
}

interface NewTask {
  title: string;
  description: string;
  deadline: string;
  priority: number;
}

const fetchTasks = async (filter: string): Promise<Task[]> => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks`,
    {
      params: { filter },
    }
  );
  return data;
};

const createTask = async (newTask: NewTask): Promise<Task> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks`,
    newTask,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

const UV_TaskManager: React.FC = () => {
  const { auth_user, set_notification } = useAppStore();
  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
    deadline: "",
    priority: 1,
  });

  const queryClient = useQueryClient();
  const { data: tasks, isLoading, isError } = useQuery<Task[], Error>({
    queryKey: ["tasks", "filter"],
    queryFn: () => fetchTasks(""),
  });

  const createTaskMutation = useMutation(createTask, {
    onSuccess: () => {
      queryClient.invalidateQueries("tasks");
      set_notification({ type: "success", message: "Task created successfully" });
      setNewTask({ title: "", description: "", deadline: "", priority: 1 });
    },
    onError: (error: Error) => {
      set_notification({ type: "error", message: error.message });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({...newTask, deadline: new Date(newTask.deadline).toISOString()});
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Task Manager</h1>

        {isError && (
          <div className="text-red-500">Error loading tasks. Please try again.</div>
        )}

        {isLoading ? (
          <div>Loading tasks...</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul>
              {tasks?.map((task) => (
                <li key={task.task_id} className="p-4 border-b last:border-none">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold">{task.title}</h2>
                      <p className="text-gray-600">{task.description}</p>
                      <p className="text-sm text-gray-500">
                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                      <span
                        className={`p-2 rounded-full text-white ${
                          task.status === "completed"
                            ? "bg-green-500"
                            : task.status === "ongoing"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button className="text-blue-500 hover:underline">Edit</button>
                      <button className="text-red-500 hover:underline">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form className="mt-6" onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold mb-3">Create New Task</h2>
          <input
            type="text"
            name="title"
            value={newTask.title}
            onChange={handleInputChange}
            className="border rounded p-2 w-full mb-3"
            placeholder="Task Title"
            required
          />
          <input
            type="text"
            name="description"
            value={newTask.description}
            onChange={handleInputChange}
            className="border rounded p-2 w-full mb-3"
            placeholder="Task Description"
            required
          />
          <input
            type="date"
            name="deadline"
            value={newTask.deadline}
            onChange={handleInputChange}
            className="border rounded p-2 w-full mb-3"
            required
          />
          <input
            type="number"
            name="priority"
            value={newTask.priority}
            onChange={handleInputChange}
            className="border rounded p-2 w-full mb-3"
            min="1"
            max="5"
            required
          />

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded mt-3"
          >
            Add Task
          </button>
        </form>
      </div>
    </>
  );
};

export default UV_TaskManager;