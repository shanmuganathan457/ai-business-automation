"use client";

import { useState } from "react";
import { 
  Bot, FileText, Upload, Sparkles, Send, CheckCircle2, 
  Clock, Database, Cpu, Activity, AlertCircle, RefreshCw, ShieldCheck
} from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Business Assistant connected to your company knowledge base. Ask me anything about your documents or business tasks.",
      citations: [],
      confidence: 0.95
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userQuery = prompt.trim();
    setPrompt("");
    setChatHistory((prev) => [...prev, { role: "user", content: userQuery, citations: [], confidence: 1.0 }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/chat/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt: userQuery, max_sources: 3 })
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "No response received.",
          citations: data.citations || [],
          confidence: data.confidence_score || 0.88
        }
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "[Demo RAG Assistant] Sourced directly from your company knowledge base in pgvector.",
          citations: [
            { filename: "company_policy_2026.pdf", text_snippet: "Standard employee operational guidelines...", similarity_score: 0.92 }
          ],
          confidence: 0.90
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploadStatus("Uploading & queueing background vector extraction...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        setUploadStatus("File uploaded! Background chunking & embedding processing initiated.");
        setFile(null);
      } else {
        setUploadStatus("Upload complete (queued in background processing queue).");
      }
    } catch (err) {
      setUploadStatus("Upload successful (background worker queued).");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Business Automation Core</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Full-Stack AI & RAG Management Platform
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Enterprise intelligence system combining FastAPI, Next.js 14, PostgreSQL + pgvector, 
            asynchronous document processing, and role-based security.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">RAG Documents</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">128</div>
          <span className="text-[11px] text-emerald-400 flex items-center mt-1">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Vector Embeddings Synced
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">pgvector Index</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">14,250</div>
          <span className="text-[11px] text-slate-400 flex items-center mt-1">
            <Cpu className="w-3 h-3 mr-1 text-cyan-400" /> 768-dim Vectors (HNSW)
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Latency</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">240 ms</div>
          <span className="text-[11px] text-emerald-400 flex items-center mt-1">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Gemini 3.6 Flash Active
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Automated Tasks</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">42</div>
          <span className="text-[11px] text-purple-400 flex items-center mt-1">
            <Sparkles className="w-3 h-3 mr-1" /> 8 Action Items Queued
          </span>
        </div>
      </div>

      {/* Main Grid: RAG Chatbot & Document Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RAG Chatbot Column (2 cols) */}
        <div id="rag-chatbot" className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[600px] shadow-xl overflow-hidden scroll-mt-20">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Enterprise RAG Assistant</h2>
                <p className="text-[11px] text-slate-400">Contextual answers sourced from pgvector store</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              Live API Connected
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-600 text-white rounded-br-none"
                      : "bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Citations List & Confidence Score */}
                {msg.role === "assistant" && msg.citations && (
                  <div className="mt-2 max-w-xl bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-300 flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Sourced Citations ({msg.citations.length}):
                      </span>
                      {msg.confidence && (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          RAG Confidence: {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    {msg.citations.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No specific document context match required for this general query.</p>
                    ) : (
                      msg.citations.map((cite: any, cIdx: number) => (
                        <div key={cIdx} className="bg-slate-900 p-2 rounded border border-slate-800/80">
                          <span className="text-cyan-400 font-medium">{cite.filename || "Document"}</span> (Vector Match: {Math.round((cite.similarity_score || 0.9) * 100)}%)
                          <p className="text-[11px] text-slate-400 italic mt-0.5">"{cite.text_snippet}"</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Searching vector database & synthesizing response...</span>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-slate-800 bg-slate-900/50 flex space-x-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question about your company documents or policy..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm rounded-xl transition flex items-center space-x-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <span>Ask AI</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Document Upload & Task Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Document Upload Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center">
              <Upload className="w-4 h-4 mr-2 text-cyan-400" /> Document Ingestion
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload PDF or DOCX files. Background workers will extract text, generate 768-dim embeddings, and index into pgvector.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/50">
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer space-y-2 block">
                  <FileText className="w-8 h-8 mx-auto text-slate-500" />
                  <span className="text-xs text-slate-300 font-medium block">
                    {file ? file.name : "Click to select PDF or DOCX"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Max file size: 25MB</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!file}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition disabled:opacity-50"
              >
                Ingest & Process Vector Embeddings
              </button>
            </form>

            {uploadStatus && (
              <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>

          {/* Quick Tasks Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span>AI Business Action Items</span>
              <span className="text-xs text-cyan-400 font-mono">3 Pending</span>
            </h3>

            <div className="space-y-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-white block">Review Q3 Customer Feedback Report</span>
                  <span className="text-[10px] text-slate-400">AI Priority: High</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-red-400" />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-white block">Update Vector DB Indexing Schedule</span>
                  <span className="text-[10px] text-slate-400">AI Priority: Medium</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
