import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MarkdownEditorWithPreview from "@/app/components/MarkdownEditorWithPreview";


export const runtime = "nodejs";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Not logged in → send to GitHub sign-in
    redirect("/api/auth/signin");
  }

  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    include: {
      _count: {
        select: { views: true },
      },
    },
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Admin – Projects
          </h1>
          <p className="text-xs text-slate-400">
            Signed in as {session.user?.email}
          </p>
        </div>

        <Link
          href="/api/auth/signout"
          className="text-xs rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400 hover:text-cyan-300"
        >
          Sign out
        </Link>
      </header>

      {/* Add project form */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-sm font-semibold">Add new project</h2>
        <p className="text-xs text-slate-400">
          Minimal version – you can refine later. Required fields: title & slug.
        </p>

        <form
          action="/api/admin/projects"
          method="POST"
          encType="multipart/form-data" 
          className="grid gap-4 text-xs md:grid-cols-2"
        >
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-slate-300">Title *</label>
            <input
              name="title"
              required
              placeholder="e.g. Payment Recovery ML"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="block text-slate-300">Slug (URL) *</label>
            <input
              name="slug"
              required
              placeholder="payment-recovery-ml"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-slate-300">Subtitle</label>
            <input
              name="subtitle"
              placeholder="Short one-line summary"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-slate-300">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="A few sentences or bullet points describing the project"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-slate-300">Cover Image</label>
            <input
              type="file"
              name="coverImage"
              accept="image/*"
              className="text-xs text-slate-300"
            />
          </div>

          {/* Markdown Content */}
          <MarkdownEditorWithPreview
            name="content"
            rows={12}
          />

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-slate-300">Status *</label>
            <select
              name="status"
              defaultValue="Completed"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Year */}
          <div className="space-y-1">
            <label className="block text-slate-300">Year</label>
            <input
              name="year"
              type="number"
              defaultValue={new Date().getFullYear()}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="block text-slate-300">Tags (comma-separated)</label>
            <input
              name="tags"
              placeholder="ML, Forecasting, Finance"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-1">
            <label className="block text-slate-300">Sort Order</label>
            <input
              name="sortOrder"
              type="number"
              placeholder="1"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* GitHub URL */}
          <div className="space-y-1">
            <label className="block text-slate-300">GitHub URL</label>
            <input
              name="githubUrl"
              placeholder="https://github.com/..."
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Live URL */}
          <div className="space-y-1">
            <label className="block text-slate-300">Live URL</label>
            <input
              name="liveUrl"
              placeholder="https://myapp.com"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked
              className="h-3 w-3 border-slate-700 bg-slate-900 rounded"
            />
            <span className="text-xs text-slate-300">Featured on homepage</span>
          </div>

          {/* Submit button */}
          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition"
            >
              Add Project
            </button>
          </div>
        </form>

      </section>

      {/* Projects list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Existing projects</h2>
        <div className="space-y-2 text-xs">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-100">{p.title}</p>
                <p className="text-[11px] text-slate-400">
                  slug: {p.slug} · year: {p.year} · featured:{" "}
                  {p.featured ? "yes" : "no"} · views:{" "}
                  {p._count?.views ?? 0}
                  {("category" in p && (p as any).category) && (
                    <> · category: {(p as any).category}</>
                  )}
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                <Link
                  href={`/projects/${p.slug}`}
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                >
                  View
                </Link>
                <Link
                  href={`/admin/edit/${p.slug}`}
                  className="text-slate-300 hover:text-cyan-200 underline underline-offset-2"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
