"use client";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  track?: boolean;
};

export default function TrackedLink({ href, children, track = true, ...rest }: Props) {
  async function trackClick() {
    if (!track) return;
    try {
      const payload = JSON.stringify({ href });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track/outbound", blob);
      } else {
        await fetch("/api/track/outbound", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      }
    } catch (error) {
      console.error("Outbound tracking failed", error);
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
