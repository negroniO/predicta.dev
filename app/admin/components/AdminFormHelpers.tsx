"use client";

import Image from "next/image";
import React, {
  createContext,
  useContext,
  useState,
  useId,
  useRef,
  useEffect,
  type FormHTMLAttributes,
} from "react";

import { useUnsavedChanges } from "./UnsavedChangesGuard";
import { responseMessage } from "@/app/lib/client-feedback";

type FormState = { submitting: boolean };
const FormStateContext = createContext<FormState | null>(null);

function formSnapshot(form: HTMLFormElement) {
  return JSON.stringify([...new FormData(form)].map(([key, value]) => [key,
    typeof value === "string" ? value : value.name ? [value.name, value.size, value.lastModified] : null]));
}

export function FormWithSubmitState(
  props: FormHTMLAttributes<HTMLFormElement> & { warnUnsaved?: boolean }
) {
  const { children, onSubmit, onChange, onClick, warnUnsaved = true, ...rest } = props;
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [publication, setPublication] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const baseline = useRef("");
  const pending = useRef(false);
  const errorId = useId();
  const { register } = useUnsavedChanges();

  useEffect(() => {
    const form = formRef.current!;
    baseline.current = formSnapshot(form);
    return register(form, () => warnUnsaved && formSnapshot(form) !== baseline.current);
  }, [register, warnUnsaved]);

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  function changed() {
    const form = formRef.current;
    if (!form || pending.current) return;
    setDirty(formSnapshot(form) !== baseline.current);
    setPublication(String(new FormData(form).get("status") || ""));
    setSaved(false);
  }

  return (
    <FormStateContext.Provider value={{ submitting }}>
      <form
        {...rest}
        ref={formRef}
        aria-busy={submitting}
        aria-describedby={error ? errorId : rest["aria-describedby"]}
        inert={submitting}
        onChange={(event) => { onChange?.(event); requestAnimationFrame(changed); }}
        onClick={(event) => { onClick?.(event); requestAnimationFrame(changed); }}
        onSubmit={async (event) => {
          onSubmit?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          if (pending.current) return;
          const form = event.currentTarget;
          const submitter = (event.nativeEvent as SubmitEvent).submitter;
          const body = new FormData(form, submitter);
          pending.current = true;
          setSubmitting(true);
          setError(null);
          setSaved(false);
          try {
            const response = await fetch(form.action, { method: "POST", body, credentials: "same-origin", headers: { Accept: "application/json" } });
            if (!response.ok) {
              setError(await responseMessage(response, "Could not save. Your changes are still here; try again."));
              return;
            }
            const result = await response.json();
            const destination = new URL(result.redirect, location.origin);
            if (result.ok !== true || typeof result.redirect !== "string" || destination.origin !== location.origin || !/^\/admin(?:\/|$)/.test(destination.pathname)) {
              throw new Error("Unexpected save response");
            }
            baseline.current = formSnapshot(form);
            setDirty(false);
            setSaved(true);
            // A full navigation also refreshes version tokens and clears controlled inputs.
            // Other dirty forms remain protected by the shared beforeunload listener.
            location.assign(destination.href);
          } catch {
            setError("Could not confirm the save. Your changes are still here. Check the saved item in another tab before retrying.");
          } finally {
            pending.current = false;
            setSubmitting(false);
          }
        }}
        data-submitting={submitting ? "true" : "false"}
      >
        {error && <div ref={errorRef} id={errorId} role="alert" tabIndex={-1}
          className="col-span-full rounded-lg border border-red-400/60 bg-red-500/10 p-3 text-xs text-red-100 focus:outline-2 focus:outline-red-300">
          {error}
        </div>}
        {children}
        <p role="status" className="col-span-full text-xs text-slate-400">
          {submitting ? "Saving…" : saved ? "Saved successfully." : warnUnsaved && dirty
            ? `Unsaved changes.${publication === "draft" || publication === "Draft" ? " Saving keeps this draft private." : publication === "published" || publication === "Completed" || publication === "In Progress" ? " Saving makes this content public." : ""}` : ""}
        </p>
      </form>
    </FormStateContext.Provider>
  );
}

export function useFormSubmitting() {
  const ctx = useContext(FormStateContext);
  return ctx?.submitting ?? false;
}

export function SubmitButton({
  children,
  disabled,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const submitting = useFormSubmitting();
  const isDisabled = disabled || submitting;
  return (
    <button
      type="submit"
      {...rest}
      disabled={isDisabled}
      className={
        (className ?? "") +
        (isDisabled ? " opacity-80 cursor-not-allowed" : "")
      }
    >
      {submitting ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 animate-spin rounded-full border border-cyan-100 border-t-transparent" />
          <span>Saving…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

type ChipInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  initialItems?: string[];
};

export function ChipInput({
  name,
  label,
  placeholder,
  initialItems = [],
}: ChipInputProps) {
  const inputId = useId();
  const [items, setItems] = useState<string[]>(initialItems);
  const [value, setValue] = useState("");

  function addItem() {
    const cleaned = value.trim();
    if (!cleaned) return;
    if (items.includes(cleaned)) {
      setValue("");
      return;
    }
    setItems((prev) => [...prev, cleaned]);
    setValue("");
  }

  function remove(item: string) {
    setItems((prev) => prev.filter((i) => i !== item));
  }

  return (
    <div className="space-y-1 md:col-span-2">
      <label htmlFor={inputId} className="block text-slate-300">{label}</label>
      <input type="hidden" name={name} value={items.join(", ")} />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-200 border border-slate-600"
          >
            {item}
            <button
              type="button"
              className="text-slate-400 hover:text-red-300"
              onClick={() => remove(item)}
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            } else if (e.key === "," || e.key === "Tab") {
              if (value.trim()) {
                e.preventDefault();
                addItem();
              }
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
        />
      </div>
      {items.length === 0 && (
        <p className="text-[11px] text-slate-500">
          Press Enter or comma to add.
        </p>
      )}
    </div>
  );
}

export function ConfirmDeleteButton({
  children,
  message = "Delete this item?",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message?: string }) {
  const submitting = useFormSubmitting();
  return (
    <button
      {...rest}
      disabled={submitting || rest.disabled}
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) {
          e.preventDefault();
        }
        rest.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SlugInputProps = {
  name: string;
  label: string;
  typeName: "project" | "category" | "page";
  initialValue?: string;
  placeholder?: string;
};

export function SlugInput({
  name,
  label,
  typeName,
  initialValue = "",
  placeholder,
}: SlugInputProps) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function checkUnique(slug: string) {
    if (!slug) {
      setError("Required");
      return;
    }
    setChecking(true);
    try {
      const params = new URLSearchParams({ slug, type: typeName });
      if (initialValue) params.set("current", initialValue);
      const res = await fetch(`/api/admin/validate/slug?${params.toString()}`);
      if (!res.ok) throw new Error("Slug validation failed");
      const json = (await res.json()) as { available: boolean };
      if (!json.available) {
        setError("Slug already exists");
      } else {
        setError(null);
      }
    } catch (e) {
      console.error("Slug check failed", e);
      setError("Could not validate");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-slate-300">{label}</label>
      <input
        id={inputId}
        name={name}
        required
        value={value}
        onChange={(e) => {
          const next = slugify(e.target.value);
          setValue(next);
          setError(null);
        }}
        onBlur={() => checkUnique(value)}
        placeholder={placeholder}
        className={
          "w-full rounded-lg bg-slate-900 border px-2 py-2 text-xs focus:border-cyan-400 outline-none " +
          (error ? "border-red-500" : "border-slate-700")
        }
      />
      <div className="text-[11px] text-slate-500 flex items-center gap-2">
        {checking && <span className="h-2 w-2 animate-spin rounded-full border border-cyan-200 border-t-transparent" />}
        {error ? <span className="text-red-300">{error}</span> : <span>Auto-sanitized; must be unique.</span>}
      </div>
    </div>
  );
}

type CoverInputProps = {
  name?: string;
  accept?: string;
  maxSizeMB?: number;
  initialUrl?: string | null;
};

export function CoverImageInput({
  name = "coverImage",
  accept = "image/png,image/jpeg,image/webp",
  maxSizeMB = 5,
  initialUrl,
}: CoverInputProps) {
  const [error, setError] = useState<string | null>(null);

  const inputId = useId();

  function validate(input: HTMLInputElement) {
    const file = input.files?.[0];
    const message = !file ? ""
      : !["image/png", "image/jpeg", "image/webp"].includes(file.type) ? "Choose a PNG, JPEG or WebP image"
      : !file.size || file.size > maxSizeMB * 1024 * 1024 ? `Choose an image between 1 byte and ${maxSizeMB}MB`
      : "";
    input.setCustomValidity(message);
    setError(message || null);
  }

  return (
    <div className="space-y-1 md:col-span-2">
      <label htmlFor={inputId} className="block text-slate-300">Cover Image</label>
      <input
        id={inputId}
        type="file"
        name={name}
        accept={accept}
        className="text-xs text-slate-300"
        onChange={(e) => validate(e.currentTarget)}
        aria-invalid={!!error}
        aria-describedby={`${inputId}-help`}
      />
      {error ? (
        <p id={`${inputId}-help`} role="alert" className="text-[11px] text-red-300">{error}</p>
      ) : (
        <p id={`${inputId}-help`} className="text-[11px] text-slate-500">
          JPEG/PNG/WebP up to {maxSizeMB}MB.
        </p>
      )}
      {initialUrl && (
        <Image
          src={initialUrl}
          alt="Current cover"
          width={240}
          height={96}
          unoptimized
          className="mt-2 h-24 rounded-lg border border-slate-700/70 object-cover"
        />
      )}
    </div>
  );
}
