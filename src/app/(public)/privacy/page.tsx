import Link from "next/link";

export default function PrivacyPage() {
  return (

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
        <h1 className="font-serif font-bold text-3xl text-[#1A3A5C] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6B8FA8] mb-10">Last updated: May 2026</p>

        {[
          {
            title: "Information We Collect",
            body: "We collect information you provide directly to us when you create an account, post an ad, or contact support. This includes your name, email address, payment information (processed securely by Stripe), and any content you upload.",
          },
          {
            title: "How We Use Your Information",
            body: "We use the information we collect to provide, maintain, and improve our services, process transactions, send transactional emails (account verification, ad status updates, receipts), and respond to support requests. We do not sell your personal information to third parties.",
          },
          {
            title: "Information Sharing",
            body: "We share your information only as necessary to provide our services — for example, with Stripe for payment processing and Cloudflare for content delivery. We may also disclose information if required by law or to protect our rights.",
          },
          {
            title: "Data Retention",
            body: "We retain your account information for as long as your account is active. Ad content and associated data are retained for 90 days after campaign completion. You may request deletion of your account and data by contacting support.",
          },
          {
            title: "Cookies",
            body: "We use cookies and similar technologies to maintain your session and remember your preferences. We do not use tracking cookies for advertising purposes.",
          },
          {
            title: "Security",
            body: "We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and secure cloud storage. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
          },
          {
            title: "Your Rights",
            body: "You have the right to access, correct, or delete your personal information at any time. To exercise these rights, contact us at the address below or use the account settings in your dashboard.",
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-8">
            <h2 className="font-serif font-bold text-lg text-[#1A3A5C] mb-2">{title}</h2>
            <p className="text-[14px] text-[#4A5568] leading-relaxed">{body}</p>
          </section>
        ))}

        <section className="mb-8">
          <h2 className="font-serif font-bold text-lg text-[#1A3A5C] mb-2">Contact Us</h2>
          <p className="text-[14px] text-[#4A5568] leading-relaxed mb-4">If you have questions about this Privacy Policy, we're happy to help.</p>
          <Link
            href="/contact"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#1A3A5C] hover:bg-[#0F2540] text-white text-sm font-semibold no-underline transition-colors"
          >
            Contact Us
          </Link>
        </section>
      </div>

  );
}
