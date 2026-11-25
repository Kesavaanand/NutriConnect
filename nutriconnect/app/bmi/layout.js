import { AudienceGuard } from '@/components/Audience';
import { AUDIENCE } from '@/lib/audience';

export default function Layout({ children }) {
  return <AudienceGuard roles={AUDIENCE.bmi}>{children}</AudienceGuard>;
}
