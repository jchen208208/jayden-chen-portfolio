import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/desk/sections/projectPage";
import { PROJECT_PAGES } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/** a page for each project with a build gallery, built ahead of time; any
 *  other slug is a 404 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECT_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECT_PAGES.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: `${project.name} — Projects — Jayden Chen`, description: project.highlights[0] };
}

export default async function ProjectRoute({ params }: Props) {
  const { slug } = await params;
  if (!PROJECT_PAGES.some((p) => p.slug === slug)) notFound();
  return <ProjectPage key={slug} slug={slug} />;
}
