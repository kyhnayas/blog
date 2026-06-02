"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  withTimeout,
  TimeoutError,
  getSessionWithTimeout,
} from "@/lib/utils/timeout";
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function NewPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(false);

  // Editor mode state: 'write' vs 'preview'
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSessionWithTimeout(supabase);

        if (!session) {
          router.push("/login?error=Please login to create a post");
          return;
        }

        // Check role with timeout
        const roleResponse = await withTimeout(
          supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single(),
        );

        if (roleResponse.error || !roleResponse.data) {
          router.push("/");
          return;
        }

        const profile = roleResponse.data;
        if (profile.role !== "editor" && profile.role !== "admin") {
          router.push("/");
          return;
        }

        setUser(session.user);
        setLoading(false);
      } catch (err: any) {
        console.error("Auth check error:", err);
        router.push("/login?error=Authentication failed. Please try again.");
      }
    }

    checkAuth();
  }, [supabase, router]);

  // Auto-generate slug from Title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // replace spaces with single dash
      .replace(/-+/g, "-"); // replace multiple dashes with single dash
    setSlug(generatedSlug);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      if (!title.trim()) throw new Error("Please enter an article title.");
      if (!slug.trim()) throw new Error("Please enter a valid URL slug.");
      if (!content.trim())
        throw new Error("Please write some content for the article.");

      // Insert article via API
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          content: content.trim(),
          imageUrl:
            imageUrl.trim() ||
            "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60",
          published,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("slug")) {
          throw new Error(
            "This URL slug is already taken. Please modify the slug or title.",
          );
        }
        throw new Error(data.error || "Failed to create post");
      }

      setMessage({
        type: "success",
        text: "Article created successfully! Redirecting...",
      });
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Save error:", err);
      const errorMsg =
        err instanceof TimeoutError
          ? "Save request timed out. Please try again."
          : err.message || "Failed to save article.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-medium">
            Preparing writing desk...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/60 pb-6">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Create New Story
            </h1>
            <p className="text-sm text-zinc-400">
              Plug in your thoughts, format in Markdown, and schedule or
              publish.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.type === "success"
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/30 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <span className="text-sm font-medium leading-relaxed">
              {message.text}
            </span>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* EDITOR BODY (LEFT 2 COLS) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glassmorphism rounded-3xl p-6 sm:p-8 border border-zinc-800/50 space-y-6">
              {/* Title & Slug inputs */}
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter a captivating title..."
                  className="block w-full bg-transparent border-0 border-b border-zinc-800 focus:border-primary-500 focus:ring-0 text-2xl sm:text-3xl font-extrabold text-white placeholder-zinc-600 pb-3 transition-colors duration-200"
                />

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="font-semibold select-none">Slug URL:</span>
                  <span className="text-zinc-500">/posts/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                    }
                    placeholder="my-first-post"
                    className="bg-transparent border-0 border-b border-dashed border-zinc-800 focus:border-primary-500 focus:ring-0 p-0 text-xs text-primary-400 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* WRITE VS PREVIEW TABS */}
              <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/30">
                <button
                  type="button"
                  onClick={() => setEditorMode("write")}
                  className={`flex-grow py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    editorMode === "write"
                      ? "bg-zinc-800 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Edit3 className="h-4 w-4" />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={`flex-grow py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    editorMode === "preview"
                      ? "bg-zinc-800 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Live Preview
                </button>
              </div>

              {/* EDITOR WORK AREA */}
              {editorMode === "write" ? (
                <div className="space-y-2">
                  <textarea
                    rows={18}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your premium article content in Markdown here... Use standard headings (#), bold (**), italic (*), quotes (>), and code blocks (```)."
                    className="block w-full px-4 py-3 bg-zinc-950/60 border border-zinc-850 rounded-2xl text-white placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm font-mono leading-relaxed resize-none"
                  />
                  <p className="text-[10px] text-zinc-500 text-right">
                    Markdown syntax is fully supported.
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-950/60 border border-zinc-850 rounded-2xl p-6 min-h-[384px] overflow-y-auto max-h-[500px]">
                  {content ? (
                    <article className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-a:text-primary-400 prose-blockquote:border-primary-500 prose-blockquote:bg-zinc-900/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl">
                      {/* Simple client-side rendering helper for headers, bold, and linebreaks in preview */}
                      {content.split("\n").map((line, i) => {
                        if (line.startsWith("# "))
                          return (
                            <h1
                              key={i}
                              className="text-2xl font-bold mt-4 mb-2"
                            >
                              {line.replace("# ", "")}
                            </h1>
                          );
                        if (line.startsWith("## "))
                          return (
                            <h2 key={i} className="text-xl font-bold mt-3 mb-2">
                              {line.replace("## ", "")}
                            </h2>
                          );
                        if (line.startsWith("### "))
                          return (
                            <h3 key={i} className="text-lg font-bold mt-2 mb-1">
                              {line.replace("### ", "")}
                            </h3>
                          );
                        if (line.startsWith("> "))
                          return (
                            <blockquote
                              key={i}
                              className="border-l-4 border-primary-500 pl-4 italic text-zinc-400 my-2"
                            >
                              {line.replace("> ", "")}
                            </blockquote>
                          );
                        return (
                          <p
                            key={i}
                            className="my-1.5 text-zinc-300 leading-relaxed min-h-[1rem]"
                          >
                            {line}
                          </p>
                        );
                      })}
                    </article>
                  ) : (
                    <div className="text-center py-20 text-zinc-500 text-xs italic">
                      Nothing to preview yet. Start typing in the Editor tab!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ARTICLE METADATA (RIGHT 1 COL) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glassmorphism rounded-3xl p-6 border border-zinc-800/50 space-y-6">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 border-b border-zinc-800/60 pb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Metadata & Settings
              </h3>

              {/* Summary Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Short Summary
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter a brief, engaging summary for the homepage grid..."
                  className="block w-full px-3 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-white placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-xs resize-none"
                />
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="block w-full px-3 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-white placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-xs"
                />
                <p className="text-[10px] text-zinc-500">
                  Provide an Unsplash or custom CDN image URL.
                </p>
              </div>

              {/* Publishing Status Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded text-primary-600 bg-zinc-900 border-zinc-800 focus:ring-primary-500 focus:ring-offset-zinc-950 h-4.5 w-4.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">
                      Publish immediately
                    </span>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      If unchecked, this post will be saved as a draft.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions Box */}
              <div className="pt-4 border-t border-zinc-800/60">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <>
                      Save Article
                      <Save className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
