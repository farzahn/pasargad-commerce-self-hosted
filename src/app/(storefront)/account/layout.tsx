// Force dynamic rendering for all account pages
export const dynamic = 'force-dynamic';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
