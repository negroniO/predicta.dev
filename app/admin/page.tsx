import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MarkdownEditorWithPreview from "@/app/components/MarkdownEditorWithPreview";
import {
  FormWithSubmitState,
  SubmitButton,
  ChipInput,
  SlugInput,
  CoverImageInput,
  ConfirmDeleteButton,
} from "./components/AdminFormHelpers";
import { CategoryForm } from "./components/CategoryForm";
import AdminTabs from "./components/AdminTabs";

export const runtime = "nodejs";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const success =
    params.created ||
    params.updated ||
    params.deleted ||
    params.category_created ||
    params.category_deleted
      ? true
      : false;
  const error = params.error ? String(params.error) : null;
  const session = await getServerSession(authOptions);

  if (!session) {
    // Not logged in → send to GitHub sign-in
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const projectSearch = (await searchParams).q
    ? String((await searchParams).q)
    : "";

  const projects = await prisma.project.findMany({
    where: projectSearch
      ? {
          OR: [
            { title: { contains: projectSearch, mode: "insensitive" } },
            { slug: { contains: projectSearch, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    include: {
      category: true,
      _count: {
        select: { views: true, reactions: true },
      },
    },
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <AdminTabs />
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

      {/* Flash messages */}
      {(success || error) && (
        <div
          className={
            "rounded-xl border px-4 py-3 text-xs " +
            (success
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
              : "border-red-500/50 bg-red-500/10 text-red-100")
          }
        >
          {success && <span>Saved successfully.</span>}
          {error && <span>Error: {error}</span>}
        </div>
      )}

      {/* Search */}
      <form className="pb-2" action="/admin" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={projectSearch}
          placeholder="Search projects by title or slug..."
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
        />
      </form>

      {/* Category manager */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-sm font-semibold">Categories</h2>
        <p className="text-xs text-slate-400">
          Manage reusable categories for projects (e.g. ML & Data, App, Article).
        </p>

        <CategoryForm nextSortOrder={categories.length + 1} />

        <div className="text-xs text-slate-300 space-y-1">
          {categories.length === 0 && (
            <p className="text-slate-400">No categories yet.</p>
          )}
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-2 gap-3"
            >
              <span className="flex flex-col">
                <span className="text-slate-200">{c.name}</span>
                <span className="text-slate-500 text-[11px]">
                  {c.slug} · order: {c.sortOrder}
                </span>
              </span>
              <form
                action={`/api/admin/categories/${c.id}`}
                method="POST"
                className="flex items-center gap-2"
              >
                <ConfirmDeleteButton
                  className="text-[11px] text-red-300 hover:text-red-200 underline underline-offset-2"
                  message={`Delete category "${c.name}"?`}
                >
                  Delete
                </ConfirmDeleteButton>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Add project form */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-sm font-semibold">Add new project</h2>
        <p className="text-xs text-slate-400">
          Minimal version – you can refine later. Required fields: title & slug.
        </p>

        <FormWithSubmitState
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
          <SlugInput
            name="slug"
            label="Slug (URL) *"
            typeName="project"
            placeholder="payment-recovery-ml"
          />

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
          <CoverImageInput />

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

          {/* Category */}
          <div className="space-y-1">
            <label className="block text-slate-300">Category</label>
            <select
              name="category"
              defaultValue=""
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            >
              <option value="">— None —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No categories yet. Add one above.
              </p>
            )}
          </div>

          <ChipInput
            name="tags"
            label="Tags"
            placeholder="Press Enter to add tag"
          />

          <ChipInput
            name="techStack"
            label="Tech stack"
            placeholder="Python, SQL, Airflow"
          />

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
            <SubmitButton className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition">
              Add Project
            </SubmitButton>
          </div>
        </FormWithSubmitState>

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
                  <p className="text-[11px] text-slate-400 flex flex-wrap gap-2 items-center">
                  <span>slug: {p.slug}</span>
                  <span>year: {p.year}</span>
                  <span>featured: {p.featured ? "yes" : "no"}</span>
                  <span>views: {p._count?.views ?? 0}</span>
                  <span>reactions: {p._count?.reactions ?? 0}</span>
                  {p.category && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-200">
                      {p.category.name}
                    </span>
                  )}
                  {p.techStack && p.techStack.length > 0 && (
                    <span className="inline-flex flex-wrap gap-1 items-center">
                      {p.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200"
                        >
                          {tech}
                        </span>
                      ))}
                      {p.techStack.length > 3 && (
                        <span className="text-slate-500 text-[10px]">
                          +{p.techStack.length - 3}
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3 text-xs items-center flex-wrap">
                {/* Feature toggle */}
                <form
                  action={`/api/admin/projects/${p.slug}`}
                  method="POST"
                  className="inline"
                >
                  <input type="hidden" name="_action" value="update" />
                  <input type="hidden" name="title" value={p.title} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="subtitle" value={p.subtitle ?? ""} />
                  <input type="hidden" name="description" value={p.description} />
                  <input type="hidden" name="content" value={p.content ?? ""} />
                  <input type="hidden" name="status" value={p.status} />
                  <input type="hidden" name="year" value={p.year} />
                  <input type="hidden" name="sortOrder" value={p.sortOrder} />
                  <input type="hidden" name="tags" value={(p.tags ?? []).join(", ")} />
                  <input type="hidden" name="techStack" value={(p.techStack ?? []).join(", ")} />
                  <input type="hidden" name="category" value={p.categoryId ?? ""} />
                  <input type="hidden" name="githubUrl" value={p.githubUrl ?? ""} />
                  <input type="hidden" name="liveUrl" value={p.liveUrl ?? ""} />
                  {!p.featured && <input type="hidden" name="featured" value="1" />}
                  <button
                    type="submit"
                    className={
                      "px-2 py-1 rounded-full border text-[11px] " +
                      (p.featured
                        ? "border-emerald-400 text-emerald-200"
                        : "border-slate-600 text-slate-300 hover:border-emerald-400")
                    }
                  >
                    {p.featured ? "Unfeature" : "Mark featured"}
                  </button>
                </form>
                {/* Sort order bump */}
                <form
                  action={`/api/admin/projects/${p.slug}`}
                  method="POST"
                  className="inline-flex items-center gap-1"
                >
                  <input type="hidden" name="_action" value="update" />
                  <input type="hidden" name="title" value={p.title} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="subtitle" value={p.subtitle ?? ""} />
                  <input type="hidden" name="description" value={p.description} />
                  <input type="hidden" name="content" value={p.content ?? ""} />
                  <input type="hidden" name="status" value={p.status} />
                  <input type="hidden" name="year" value={p.year} />
                  <input type="hidden" name="tags" value={(p.tags ?? []).join(", ")} />
                  <input type="hidden" name="techStack" value={(p.techStack ?? []).join(", ")} />
                  <input type="hidden" name="category" value={p.categoryId ?? ""} />
                  <input type="hidden" name="githubUrl" value={p.githubUrl ?? ""} />
                  <input type="hidden" name="liveUrl" value={p.liveUrl ?? ""} />
                  {p.featured && <input type="hidden" name="featured" value="1" />}
                  <input type="hidden" name="sortOrder" value={Math.max(0, p.sortOrder - 1)} />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded-full border border-slate-600 text-[11px] text-slate-300 hover:border-cyan-400"
                    title="Move up"
                  >
                    ↑
                  </button>
                </form>
                <form
                  action={`/api/admin/projects/${p.slug}`}
                  method="POST"
                  className="inline-flex items-center gap-1"
                >
                  <input type="hidden" name="_action" value="update" />
                  <input type="hidden" name="title" value={p.title} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="subtitle" value={p.subtitle ?? ""} />
                  <input type="hidden" name="description" value={p.description} />
                  <input type="hidden" name="content" value={p.content ?? ""} />
                  <input type="hidden" name="status" value={p.status} />
                  <input type="hidden" name="year" value={p.year} />
                  <input type="hidden" name="tags" value={(p.tags ?? []).join(", ")} />
                  <input type="hidden" name="techStack" value={(p.techStack ?? []).join(", ")} />
                  <input type="hidden" name="category" value={p.categoryId ?? ""} />
                  <input type="hidden" name="githubUrl" value={p.githubUrl ?? ""} />
                  <input type="hidden" name="liveUrl" value={p.liveUrl ?? ""} />
                  {p.featured && <input type="hidden" name="featured" value="1" />}
                  <input type="hidden" name="sortOrder" value={p.sortOrder + 1} />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded-full border border-slate-600 text-[11px] text-slate-300 hover:border-cyan-400"
                    title="Move down"
                  >
                    ↓
                  </button>
                </form>
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
