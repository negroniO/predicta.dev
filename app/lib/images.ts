export function canOptimizeCover(src: string): boolean {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) return false;
  try {
    const image = new URL(src);
    const storage = new URL(configured);
    return image.protocol === "https:" && image.hostname === storage.hostname &&
      !image.port && !image.username && !image.password && !image.search &&
      image.pathname.startsWith("/storage/v1/object/public/project-images/");
  } catch {
    return false;
  }
}
