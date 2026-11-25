import LegalPage from '@/components/LegalPage';

export const metadata = { title: 'Terms of Service — NutriConnect' };
export const dynamic = 'force-dynamic';

export default function TermsPage() {
  const contact = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'the administrator of this website';
  return (
    <LegalPage title="Terms of Service" updated="25 November 2026">
      <p>By creating an account or using NutriConnect you agree to these terms.</p>
      <section>
        <h2>The service</h2>
        <p>NutriConnect is a marketplace where clients book live chat consultations and diet packages with independent dieticians and nutritionists, who are reviewed and approved by our administrators before they can take clients.</p>
      </section>
      <section>
        <h2>Not emergency medical care</h2>
        <p>Advice on NutriConnect is general nutrition guidance and does not replace a doctor. For medical emergencies, contact a hospital or emergency services immediately. Tell your expert about any medical conditions, allergies or medicines.</p>
      </section>
      <section>
        <h2>Accounts</h2>
        <ul>
          <li>Give accurate details and verify your email address. Keep your password private.</li>
          <li>One person per account. You are responsible for activity on your account.</li>
        </ul>
      </section>
      <section>
        <h2>Bookings, prices and refunds</h2>
        <ul>
          <li>Sessions are priced between ₹100 and ₹500 per hour. New clients may receive a free 10-minute trial and 10% off their first paid booking.</li>
          <li>If an expert declines your request, or you cancel before it is accepted, your payment is refunded.</li>
          <li>Live chat is open only during a session; either side can ask to end it early, and the other side must agree.</li>
        </ul>
      </section>
      <section>
        <h2>Respectful conduct</h2>
        <ul>
          <li>Be polite. Rude messages and low politeness ratings are reported to the administrators.</li>
          <li>Do not share phone numbers in chat or try to take consultations off the platform.</li>
          <li>Experts with five reports may be suspended; a hearing is held five days later to decide on reinstatement or termination.</li>
        </ul>
      </section>
      <section>
        <h2>Feedback</h2>
        <p>Clients are asked to rate every completed booking. Feedback must be honest and must not contain abuse.</p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>We may update these terms; the date above shows the latest version. Contact: <b>{contact}</b>.</p>
      </section>
    </LegalPage>
  );
}
