"use client";

import { useState } from "react";
import {
  FormWithSubmitState,
  SubmitButton,
  SlugInput,
  slugify,
} from "./AdminFormHelpers";

export function CategoryForm({ nextSortOrder }: { nextSortOrder: number }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function handleNameChange(val: string) {
    setName(val);
    if (!slug) {
      setSlug(slugify(val));
    }
  }

  return (
    <FormWithSubmitState
      action="/api/admin/categories"
      method="POST"
      className="grid gap-3 text-xs md:grid-cols-4"
    >
      <div className="space-y-1 md:col-span-2">
        <label className="block text-slate-300">Name</label>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="ML & Data"
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
        />
      </div>
      <SlugInput
        name="slug"
        label="Slug"
        typeName="category"
        initialValue={slug}
        placeholder="ml-data"
      />
      <div className="space-y-1">
        <label className="block text-slate-300">Sort Order</label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={nextSortOrder}
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none"
        />
      </div>
      <div className="md:col-span-4 pt-1">
        <SubmitButton className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition">
          Add Category
        </SubmitButton>
      </div>
    </FormWithSubmitState>
  );
}
