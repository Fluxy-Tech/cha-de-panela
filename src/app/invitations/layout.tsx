import { SiteHeader } from "@/components/site-header";

export default function InvitationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader variant="solid" />
      {children}
    </>
  );
}
