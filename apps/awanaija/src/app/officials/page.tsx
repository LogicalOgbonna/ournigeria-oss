import { getOfficials } from "@/lib/api";
import { PageLayout } from "@/components/layout/PageLayout";
import { OfficialsDirectoryHeader, OfficialsClientContent, OfficialsSidebar } from "./_component";
import { StructuredData } from "./_seo/structured-data";

export { metadata } from "./_seo/util";

export default async function OfficialsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; party?: string; page?: string }>;
}) {
  const { search = "", role = "", party = "", page = "1" } = await searchParams;

  const params: Record<string, string> = { page, limit: "24" };
  if (search) params.search = search;
  if (role) params.role = role;
  if (party) params.party = party;

  const res = await getOfficials(params);

  return (
    <PageLayout className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]" mainClassName="pt-24">
      <StructuredData />
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <OfficialsDirectoryHeader total={res.total} />
            <OfficialsClientContent
              initialSearch={search}
              initialRole={role}
              currentPage={parseInt(page, 10)}
              officials={res.data}
              totalPages={res.pages}
            />
          </div>
          <OfficialsSidebar />
        </div>
      </div>
    </PageLayout>
  );
}
