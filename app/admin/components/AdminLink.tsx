import type { AnchorHTMLAttributes } from "react";

// Full document navigation lets Back/Forward use the browser's beforeunload
// protection. This small admin area prioritizes retaining unsaved edits.
export default function AdminLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
