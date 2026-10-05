export const dynamic = "force-dynamic";
// app/page.tsx
import HomePageServer from "./homepage-server";

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <HomePageServer />;
}
