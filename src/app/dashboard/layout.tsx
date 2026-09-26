import { requireUser } from "@/lib/dal";
import { SiteHeader } from "@/components/site-header";
import { LogoutButton } from "@/components/dashboard/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-[#FDFCF7]">
      <SiteHeader
        variant="solid"
        actions={
          <>
            <span className="hidden text-sm text-yellow-50/80 lg:inline">
              {user.email}
            </span>
            <LogoutButton className="h-9 border-yellow-50/60 px-3 text-yellow-50 hover:bg-yellow-50 hover:text-[#4A3F35]" />
          </>
        }
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
        {children}
      </main>
    </div>
  );
}
