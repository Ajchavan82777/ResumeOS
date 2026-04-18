"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useResume, useAutoSave } from "@/hooks/useResume";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { useBuilderStore } from "@/store";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;
  const { data: resume, isLoading, error } = useResume(resumeId);
  const { reset } = useBuilderStore();

  useAutoSave(resumeId);

  useEffect(() => {
    return () => reset();
  }, [resumeId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
          <p className="text-sm text-gray-400">Loading your resume…</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Resume not found or access denied.</p>
          <button onClick={() => router.push("/dashboard")} className="rounded-lg bg-teal-500 px-4 py-2 text-sm text-white hover:bg-teal-600">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <BuilderShell resumeId={resumeId} />;
}
