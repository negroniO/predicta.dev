"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type FormHTMLAttributes,
} from "react";

type FormState = { submitting: boolean };
const FormStateContext = createContext<FormState | null>(null);

export function FormWithSubmitState(
  props: FormHTMLAttributes<HTMLFormElement> & { disableOnSubmit?: boolean }
) {
  const { children, onSubmit, disableOnSubmit = true, ...rest } = props;
  const [submitting, setSubmitting] = useState(false);

  return (
    <FormStateContext.Provider value={{ submitting }}>
      <form
        {...rest}
        onSubmit={(e) => {
          onSubmit?.(e);
          if (e.defaultPrevented) return;
          if (submitting) {
            e.preventDefault();
            return;
          }
          if (disableOnSubmit) setSubmitting(true);
        }}
        data-submitting={submitting ? "true" : "false"}
      >
        {children}
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
      <label className="block text-slate-300">{label}</label>
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
  return (
    <button
      {...rest}
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
  typeName: "project" | "category";
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
      <label className="block text-slate-300">{label}</label>
      <input
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
  accept = "image/*",
  maxSizeMB = 5,
  initialUrl,
}: CoverInputProps) {
  const [error, setError] = useState<string | null>(null);

  function validate(file: File | null) {
    if (!file) {
      setError(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files allowed");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Max size ${maxSizeMB}MB`);
      return;
    }
    setError(null);
  }

  return (
    <div className="space-y-1 md:col-span-2">
      <label className="block text-slate-300">Cover Image</label>
      <input
        type="file"
        name={name}
        accept={accept}
        className="text-xs text-slate-300"
        onChange={(e) => validate(e.target.files?.[0] ?? null)}
      />
      {error ? (
        <p className="text-[11px] text-red-300">{error}</p>
      ) : (
        <p className="text-[11px] text-slate-500">
          JPEG/PNG/WebP up to {maxSizeMB}MB.
        </p>
      )}
      {initialUrl && (
        <img
          src={initialUrl}
          alt="Cover"
          className="mt-2 h-24 rounded-lg border border-slate-700/70 object-cover"
        />
      )}
    </div>
  );
}
