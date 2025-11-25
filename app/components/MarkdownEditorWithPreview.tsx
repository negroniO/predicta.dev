"use client";

import { useState } from "react";
import { marked } from "marked";

type MarkdownEditorWithPreviewProps = {
  name: string;
  label?: string;
  initialValue?: string;
  rows?: number;
};

export default function MarkdownEditorWithPreview({
  name,
  label = "Content (Markdown)",
  initialValue = "",
  rows = 16,
}: MarkdownEditorWithPreviewProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="md:col-span-2 space-y-2">
      <label className="block text-slate-300 text-xs">{label}</label>

      {/* Editor + Preview grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Editor */}
        <div className="space-y-1">
          <textarea
            name={name}
            rows={rows}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:border-cyan-400 outline-none font-mono resize-y min-h-[180px]"
            placeholder="Write full case study here using Markdown..."
          />
          <p className="text-[10px] text-slate-500">
            Tip: Supports <code>## headings</code>, <code>- bullet lists</code>,{" "}
            <code>**bold**</code>, <code>`code`</code>, and links.
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs overflow-auto min-h-[180px]">
          <p className="text-[10px] text-slate-500 mb-1">Preview</p>
          {value.trim() ? (
            <div
              className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-code:text-cyan-300"
              dangerouslySetInnerHTML={{ __html: marked(value) }}
            />
          ) : (
            <p className="text-[11px] text-slate-500">
              Start typing on the left to see a live preview here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
