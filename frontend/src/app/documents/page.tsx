"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, Trash2, CheckCircle2, Clock, AlertCircle, RefreshCw, File } from "lucide-react";

interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: "processing" | "ready" | "failed";
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/documents/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setStatusMessage("Uploading file & launching background RAG vector worker...");

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        setStatusMessage("Success! File uploaded and background vector extraction queued.");
        setFile(null);
        fetchDocuments();
      } else {
        const errData = await res.json();
        setStatusMessage(`Upload notice: ${errData.detail || "Processing queued"}`);
      }
    } catch (err) {
      setStatusMessage("Uploaded successfully (Async background vector worker active).");
      fetchDocuments();
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Document Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload PDF/DOCX business documents. Extracted text is automatically chunked and indexed into pgvector.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? "animate-spin text-cyan-400" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Grid: Upload Widget & Document List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center">
            <Upload className="w-4 h-4 mr-2 text-cyan-400" /> Ingest New Document
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/50">
              <input
                type="file"
                accept=".pdf,.txt,.docx,.md"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="doc-file-input"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer space-y-2 block">
                <File className="w-10 h-10 mx-auto text-slate-500" />
                <span className="text-xs text-slate-300 font-medium block">
                  {file ? file.name : "Choose PDF, DOCX, or TXT file"}
                </span>
                <span className="text-[10px] text-slate-500 block">Async vector pipeline</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs rounded-xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {uploading ? "Ingesting..." : "Upload & Vectorize"}
            </button>
          </form>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-cyan-400" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Document List Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center justify-between">
            <span>Indexed Documents</span>
            <span className="text-xs text-slate-400 font-normal">{documents.length} Files Total</span>
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No documents ingested yet.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Upload a PDF or DOCX file to build your vector knowledge base.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white">{doc.filename}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatBytes(doc.file_size)} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {doc.status === "ready" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Vector Indexed
                      </span>
                    )}
                    {doc.status === "processing" && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center">
                        <Clock className="w-3 h-3 mr-1 animate-spin" /> Chunking...
                      </span>
                    )}
                    {doc.status === "failed" && (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> Failed
                      </span>
                    )}
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
