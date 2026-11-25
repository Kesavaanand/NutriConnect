import RoleGuard from '@/components/RoleGuard';

// Approval gate (pending / rejected / suspended experts only see their application or hearing)
// is handled inside RoleGuard for this tab's login; the APIs enforce it on the server too.
export default function ProviderLayout({ children }) {
  return <RoleGuard role="provider">{children}</RoleGuard>;
}
