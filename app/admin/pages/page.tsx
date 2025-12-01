import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MarkdownEditorWithPreview from "@/app/components/MarkdownEditorWithPreview";
import {
  FormWithSubmitState,
  SubmitButton,
  SlugInput,
  ConfirmDeleteButton,
} from "../components/AdminFormHelpers";
import AdminTabs from "../components/AdminTabs";

export const runtime = "nodejs";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminPages({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin?callbackUrl=/admin/pages");

  const pages = await prisma.page.findMany({
    orderBy: [{ slug: "asc" }],
  });

  const success =
    params.created ||
    params.updated ||
    params.deleted ||
    params.category_created ||
    params.category_deleted
      ? true
      : false;
  const error = params.error ? String(params.error) : null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <AdminTabs />
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Admin – Pages
          </h1>
          <p className="text-xs text-slate-400">Signed in as {session.user?.email}</p>
        </div>
        <Link
          href="/admin"
          className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
        >
          ← Back to projects
        </Link>
      </header>

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

      {/* Create new page */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 space-y-3 text-xs">
        <h2 className="text-sm font-semibold text-slate-100">Create page</h2>
        <FormWithSubmitState
          action="/api/admin/pages"
          method="POST"
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-1">
            <label className="block text-slate-300">Title *</label>
            <input
              name="title"
              required
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <SlugInput
            name="slug"
            label="Slug (URL) *"
            typeName="page"
            placeholder="about"
          />

          <div className="space-y-1 md:col-span-2">
            <label className="block text-slate-300">Excerpt</label>
            <textarea
              name="excerpt"
              rows={2}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300">Status</label>
            <select
              name="status"
              defaultValue="published"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <MarkdownEditorWithPreview name="content" rows={12} />
          </div>

          <div className="md:col-span-2">
            <SubmitButton className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition">
              Create page
            </SubmitButton>
          </div>
        </FormWithSubmitState>
      </section>

      {/* Existing pages */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Existing pages</h2>
        <div className="space-y-4">
          {pages.length === 0 && (
            <p className="text-xs text-slate-400">No pages yet.</p>
          )}
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 space-y-3 text-xs"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-slate-100">{page.title}</p>
                  <p className="text-[11px] text-slate-500">
                    slug: {page.slug} · status: {page.status}
                  </p>
                </div>
                <Link
                  href={`/${page.slug}`}
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                  target="_blank"
                >
                  View
                </Link>
              </div>

              <FormWithSubmitState
                action={`/api/admin/pages/${page.slug}`}
                method="POST"
                className="grid gap-4 md:grid-cols-2"
              >
                <input type="hidden" name="_action" value="update" />
                <div className="space-y-1">
                  <label className="block text-slate-300">Title *</label>
                  <input
                    name="title"
                    defaultValue={page.title}
                    required
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs focus:border-cyan-400 outline-none"
                  />
                </div>

                <SlugInput
                  name="slug"
                  label="Slug (URL) *"
                  typeName="page"
                  initialValue={page.slug}
                />

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-slate-300">Excerpt</label>
                  <textarea
                    name="excerpt"
                    defaultValue={page.excerpt ?? ""}
                    rows={2}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300">Status</label>
                  <select
                    name="status"
                    defaultValue={page.status}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <MarkdownEditorWithPreview
                    name="content"
                    initialValue={page.content ?? ""}
                    rows={10}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between pt-1">
                  <SubmitButton className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition">
                    Save page
                  </SubmitButton>
                </div>
              </FormWithSubmitState>
              <form
                action={`/api/admin/pages/${page.slug}`}
                method="POST"
                className="inline"
              >
                <input type="hidden" name="_action" value="delete" />
                <ConfirmDeleteButton
                  className="text-[11px] text-red-300 hover:text-red-200 underline underline-offset-2"
                  message={`Delete page "${page.title}"?`}
                >
                  Delete
                </ConfirmDeleteButton>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
