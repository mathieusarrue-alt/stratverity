import { notFound } from "next/navigation";

export default async function TopBottomOscillatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_TBO_ENABLED !== "true") notFound();
  return <>{children}</>;
}
