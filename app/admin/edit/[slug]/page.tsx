import { prisma } from "@/app/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import MarkdownEditorWithPreview from "@/app/components/MarkdownEditorWithPreview";


export const runtime = "nodejs";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Edit project
          </h1>
          <p className="text-xs text-slate-400">
            Editing <span className="font-mono">{project.slug}</span>
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
        >
          ← Back to admin
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 space-y-4 text-xs">
        {/* UPDATE FORM */}
        <form
          action={`/api/admin/projects/${project.slug}`}
          method="POST"
          encType="multipart/form-data"
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" name="_action" value="update" />

          <div className="space-y-1">
            <label className="block text-slate-300">Title *</label>
            <input
              name="title"
              defaultValue={project.title}
              required
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300">Slug (URL) *</label>
            <input
              name="slug"
              defaultValue={project.slug}
              required
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-slate-300">Subtitle</label>
            <input
              name="subtitle"
              defaultValue={project.subtitle ?? ""}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-slate-300">Description</label>
            <textarea
              name="description"
              defaultValue={project.description}
              rows={4}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

            <MarkdownEditorWithPreview
              name="content"
              initialValue={project.content ?? ""}
              rows={16}
            />

          <div className="space-y-1">
            <label className="block text-slate-300">Status *</label>
            <select
              name="status"
              defaultValue={project.status}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300">Year</label>
            <input
              name="year"
              type="number"
              defaultValue={project.year}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300">
              Tags (comma-separated)
            </label>
            <input
              name="tags"
              defaultValue={project.tags?.join(", ") ?? ""}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300">Sort Order</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={project.sortOrder}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300">GitHub URL</label>
            <input
              name="githubUrl"
              defaultValue={project.githubUrl ?? ""}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300">Live URL</label>
            <input
              name="liveUrl"
              defaultValue={project.liveUrl ?? ""}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={project.featured}
              className="h-3 w-3 border-slate-700 bg-slate-900 rounded"
            />
            <span className="text-xs text-slate-300">
              Featured on homepage
            </span>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-slate-300">Cover Image (Upload to replace)</label>
            <input
              type="file"
              name="coverImage"
              accept="image/*"
              className="text-xs text-slate-300"
            />

            {project.coverImageUrl && (
              <img
                src={project.coverImageUrl}
                alt="Cover"
                className="mt-2 h-24 rounded-lg border border-slate-700/70 object-cover"
              />
            )}
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition"
            >
              Save changes
            </button>
          </div>
        </form>

        {/* DELETE FORM */}
        <form
          action={`/api/admin/projects/${project.slug}`}
          method="POST"
          className="pt-2"
        >
          <input type="hidden" name="_action" value="delete" />
          <button
            type="submit"
            className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
          >
            Delete project
          </button>
        </form>
      </section>
    </main>
  );
}
