import RoleGuard from '@/components/RoleGuard';
import FeedbackGate from '@/components/FeedbackGate';

export default function ClientLayout({ children }) {
  return (
    <RoleGuard role="client">
      <FeedbackGate />
      {children}
    </RoleGuard>
  );
}
