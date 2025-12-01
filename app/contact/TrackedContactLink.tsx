"use client";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export default function TrackedContactLink({
  href,
  children,
  ...rest
}: Props) {
  async function trackClick() {
    try {
      const payload = JSON.stringify({ href });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/contact/track", blob);
      } else {
        await fetch("/api/contact/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      }
    } catch (error) {
      console.error("Contact click tracking failed", error);
    }
  }

  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        rest.onClick?.(e);
        trackClick();
      }}
    >
      {children}
    </a>
  );
}
