"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, FileText, LayoutDashboard, CheckSquare, ShieldCheck, LogIn, LogOut, UserPlus } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

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
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Role: <strong className="text-white capitalize">{user.role}</strong></span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg transition shadow-md shadow-cyan-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
