import LegalPage from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy — NutriConnect' };
export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  const contact = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'the administrator of this website';
  return (
    <LegalPage title="Privacy Policy" updated="25 November 2026">
      <p>NutriConnect connects clients with verified dieticians and nutritionists. This policy explains what information we collect, why, and the choices you have.</p>
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><b>Account details:</b> first and last name, email address, phone number and password (stored only in encrypted, hashed form).</li>
          <li><b>Google Sign-In:</b> if you choose “Continue with Google”, we receive your name, email address and profile picture from Google. We do not receive your Google password.</li>
          <li><b>Health and progress information you choose to share:</b> goals, health notes, weight, height, BMI and waist measurements.</li>
          <li><b>Consultation data:</b> bookings, live-chat messages, diet prescriptions and the feedback you give.</li>
          <li><b>Dietician applications:</b> qualifications, licence details and the documents experts upload.</li>
          <li><b>Payments:</b> handled by Razorpay. We store the amount and payment status, never your card or UPI details.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To create and secure your account, including email verification codes and password-reset links.</li>
          <li>To let you book experts, chat with them and receive your diet prescription.</li>
          <li>To review dietician applications, handle reports and keep the platform respectful and safe.</li>
        </ul>
        <p className="mt-2">We do not sell your personal information or use it for advertising.</p>
      </section>
      <section>
        <h2>Who can see your information</h2>
        <ul>
          <li>Your dietician sees your name, booking details, chat, progress and health notes for your consultations. Experts do not see your phone number or email address.</li>
          <li>NutriConnect administrators can see account, booking, report and feedback information to run and moderate the service.</li>
          <li>Service providers that help us operate: MongoDB Atlas (database), Render (hosting), Brevo (sending emails), Razorpay (payments) and Google (sign-in).</li>
        </ul>
      </section>
      <section>
        <h2>Your choices</h2>
        <ul>
          <li>You can update your profile, and you can ask us to delete your account and data by contacting us.</li>
          <li>Phone numbers cannot be shared in chat, to protect both clients and experts.</li>
        </ul>
      </section>
      <section>
        <h2>Security</h2>
        <p>Passwords, verification codes and reset links are stored only as one-way hashes. Connections to the site use HTTPS. No online service is completely secure, so please use a strong, unique password.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions or deletion requests: <b>{contact}</b>.</p>
      </section>
    </LegalPage>
  );
}
