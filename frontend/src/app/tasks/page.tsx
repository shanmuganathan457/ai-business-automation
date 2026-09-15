"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Plus, Sparkles, Clock, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [aiPrompt, setAiPrompt] = useState("");
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/assistant/tasks", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/assistant/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, description, priority }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        fetchTasks();
      }
    } catch (err) {
      console.error("Create task failed", err);
    }
  };

  const handleAiAutoSuggest = async () => {
    if (!aiPrompt.trim() || analyzingAi) return;
    setAnalyzingAi(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/assistant/auto-suggest-task?request_prompt=${encodeURIComponent(aiPrompt)}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setTitle(data.suggested_task.title);
        setDescription(`AI Analysis: ${data.analysis}`);
        setPriority(data.suggested_task.priority.toLowerCase() as any);
        setAiPrompt("");
      }
    } catch (err) {
      setTitle(`AI Follow up: ${aiPrompt.slice(0, 30)}...`);
      setDescription(`AI extracted action items from request: "${aiPrompt}"`);
      setPriority("high");
      setAiPrompt("");
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: "pending" | "in_progress" | "completed") => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/assistant/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Update task status failed", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-purple-400" />
            <span>AI Task Automation & Business Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage tasks manually or use Gemini AI to analyze business requests and extract actionable tasks automatically.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? "animate-spin text-purple-400" : ""}`} />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* Grid: AI Assistant Generator & Task Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Auto-Suggest Widget & Create Form */}
        <div className="space-y-6">
          {/* AI Task Generator */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-400" /> AI Task Analyzer
            </h2>
            <p className="text-xs text-slate-400">
              Paste a customer email or request below. Gemini AI will analyze urgency and pre-fill a task for you.
            </p>

            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: Client reported an urgent issue with payment integration on checkout page..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="button"
                onClick={handleAiAutoSuggest}
                disabled={!aiPrompt.trim() || analyzingAi}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-xs rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{analyzingAi ? "Analyzing Request..." : "Analyze & Pre-fill Task"}</span>
              </button>
            </div>
          </div>

          {/* Create Task Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center">
              <Plus className="w-4 h-4 mr-2 text-cyan-400" /> Create Task
            </h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Review quarterly financial summary"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details or steps..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="low">Low Priority (🟢)</option>
                  <option value="medium">Medium Priority (🟡)</option>
                  <option value="high">High Priority (🔴)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!title.trim()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition disabled:opacity-50"
              >
                Add Task to Board
              </button>
            </form>
          </div>
        </div>

        {/* Task Board Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center justify-between">
            <span>Action Board</span>
            <span className="text-xs text-slate-400 font-normal">{tasks.length} Active Tasks</span>
          </h2>

          {tasks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No tasks created yet.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Use the AI Task Analyzer or add a task manually above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-semibold text-white">{task.title}</h3>
                      {task.priority === "high" && (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold">HIGH</span>
                      )}
                      {task.priority === "medium" && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold">MEDIUM</span>
                      )}
                      {task.priority === "low" && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">LOW</span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                    )}
                  </div>

                  {/* Status Switcher Buttons */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(task.id, "pending")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                        task.status === "pending"
                          ? "bg-slate-800 text-cyan-400 border border-slate-700"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(task.id, "in_progress")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                        task.status === "in_progress"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(task.id, "completed")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                        task.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
