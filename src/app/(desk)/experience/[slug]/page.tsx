import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RolePage } from "@/components/desk/sections/experienceRole";
import { EXPERIENCE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/** one page per role, built ahead of time; any other slug is a 404 */
export const dynamicParams = false;

export function generateStaticParams() {
  return EXPERIENCE.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const role = EXPERIENCE.find((r) => r.slug === slug);
  if (!role) return {};
  const name = role.project ? `${role.role} (${role.project})` : role.role;
  return { title: `${name} — Experience — Jayden Chen`, description: role.blurb };
}

export default async function RoleRoute({ params }: Props) {
  const { slug } = await params;
  if (!EXPERIENCE.some((r) => r.slug === slug)) notFound();
  // keyed, so moving to a neighbouring role starts the page afresh
  return <RolePage key={slug} slug={slug} />;
}
