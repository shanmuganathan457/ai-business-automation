"use client";

import Link from "next/link";
import { Bot, FileText, LayoutDashboard, CheckSquare, ShieldCheck } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <Link href="/" className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              NexusAI <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Enterprise</span>
            </Link>
          </div>

          <div className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/#rag-chat" className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors">
              <Bot className="w-4 h-4" />
              <span>RAG Chatbot</span>
            </Link>
            <Link href="/#documents" className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </Link>
            <Link href="/#tasks" className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors">
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Role: <strong className="text-white">Admin</strong></span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
