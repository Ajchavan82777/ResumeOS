"use client";
import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Sparkles, X, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface ResumeStartModalProps {
  templateSlug: string;
  onStartFresh: () => void;
  onParsed: (parsedData: ParsedResume) => void;
  loading?: boolean;
}

export interface ParsedResume {
  personal?: Record<string, string>;
  summary?: string;
  experience?: any[];
  education?: any[];
  skills?: any[];
  achievements?: any[];
  certifications?: any[];
  languages?: any[];
}

export function ResumeStartModal({ templateSlug, onStartFresh, onParsed, loading }: ResumeStartModalProps) {
  const [dragging,     setDragging]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState("");
  const [showPaste,    setShowPaste]    = useState(false);
  const [pasteText,    setPasteText]    = useState("");
  const [parsingPaste, setParsingPaste] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setUploadError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("resume", file);
      // Do NOT set Content-Type manually — axios sets multipart/form-data with boundary automatically
      const { data } = await api.post("/resumes/parse-upload", form, {
        timeout: 60000,
      });
      onParsed(data.parsed);
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || "Could not parse the file. Try pasting your resume text instead.");
    } finally {
      setUploading(false);
    }
  }, [onParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setParsingPaste(true);
    setUploadError("");
    try {
      const { data } = await api.post("/resumes/parse-text", { text: pasteText });
      onParsed(data.parsed);
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || "Could not parse the text.");
    } finally {
      setParsingPaste(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Create Your Resume</h2>
          <p className="text-teal-100 text-sm">How would you like to start?</p>
        </div>

        <div className="p-8">
          {!showPaste ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Start Fresh */}
                <button
                  onClick={onStartFresh}
                  disabled={loading}
                  className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 p-6 text-center transition hover:border-teal-400 hover:bg-teal-50 disabled:opacity-50"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 group-hover:bg-teal-200 transition">
                    <FileText size={26} className="text-teal-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Start from Scratch</div>
                    <div className="text-xs text-gray-500 leading-relaxed">
                      Pre-filled with sample placeholder data so you can see the layout and edit each section.
                    </div>
                  </div>
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                    </div>
                  )}
                </button>

                {/* Upload Resume */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition cursor-pointer ${dragging ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-400 hover:bg-teal-50"}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 group-hover:bg-blue-200 transition">
                    {uploading
                      ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      : <Upload size={26} className="text-blue-600" />
                    }
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">
                      {uploading ? "Parsing Resume…" : "Upload Existing Resume"}
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">
                      PDF, DOCX, or TXT — we'll extract your information and fill the template automatically.
                    </div>
                  </div>
                  {dragging && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-teal-500 bg-teal-50/90">
                      <span className="font-semibold text-teal-700">Drop to parse</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider with paste option */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                onClick={() => setShowPaste(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 transition"
              >
                <Sparkles size={15} />
                Paste resume text for AI extraction
              </button>

              {uploadError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </>
          ) : (
            /* Paste text view */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setShowPaste(false)} className="text-gray-400 hover:text-gray-700 transition">
                  <X size={18} />
                </button>
                <span className="text-sm font-semibold text-gray-700">Paste your resume text</span>
              </div>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste the full text of your existing resume here…"
                rows={10}
                className="w-full resize-none rounded-xl border-2 border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-teal-400"
              />
              {uploadError && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowPaste(false)}
                  className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim() || parsingPaste}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50 transition"
                >
                  {parsingPaste ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Parsing…</>
                  ) : (
                    <><Sparkles size={14} /> Extract & Fill Resume</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
