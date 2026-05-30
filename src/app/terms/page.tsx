import { PublicLayout } from "@/components/layout/PublicLayout";

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
        <h1 className="font-serif font-bold text-3xl text-[#1A3A5C] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#6B8FA8] mb-10">Last updated: May 2026</p>

        {[
          {
            title: "Acceptance of Terms",
            body: "By accessing or using CommunityBulletin.com, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.",
          },
          {
            title: "Description of Service",
            body: "CommunityBulletin.com provides a digital in-store advertising platform that connects local advertisers with store owners. Advertisers can submit display ads that are shown on screens at participating store locations.",
          },
          {
            title: "User Accounts",
            body: "You must create an account to post ads or list a store. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate and complete information when registering.",
          },
          {
            title: "Ad Submission and Review",
            body: "All ads are subject to review before display. We reserve the right to reject any ad that violates our content guidelines, including ads containing prohibited content, misleading claims, low-resolution images, or material that infringes on third-party rights. Rejected ads will receive a full refund.",
          },
          {
            title: "Prohibited Content",
            body: "You may not submit ads that contain: illegal products or services, adult or sexually explicit material, hate speech or discrimination, violent or threatening content, deceptive or fraudulent claims, or content that infringes on any intellectual property rights.",
          },
          {
            title: "Payments and Refunds",
            body: "Ad campaigns are billed at $100 per week per location at the time of submission. If your ad is denied after review, you will receive a full refund within 3–5 business days. Approved ads cancelled before the run start date may be eligible for a refund — contact support for details.",
          },
          {
            title: "Intellectual Property",
            body: "You retain ownership of the content you submit. By submitting an ad, you grant CommunityBulletin.com a non-exclusive, royalty-free license to display your content on our platform and partner store screens for the duration of your campaign.",
          },
          {
            title: "Limitation of Liability",
            body: "CommunityBulletin.com is not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability to you for any claim is limited to the amount you paid for the specific campaign giving rise to the claim.",
          },
          {
            title: "Termination",
            body: "We reserve the right to suspend or terminate accounts that violate these terms. You may close your account at any time by contacting support. Upon termination, your right to use the service ceases immediately.",
          },
          {
            title: "Changes to Terms",
            body: "We may update these Terms of Service from time to time. We will notify you of material changes by email or by posting a notice on our website. Continued use of the service after changes take effect constitutes acceptance of the revised terms.",
          },
          {
            title: "Contact Us",
            body: "If you have questions about these Terms of Service, please contact us via the Help & Support page or email us at support@communitybulletin.com.",
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-8">
            <h2 className="font-serif font-bold text-lg text-[#1A3A5C] mb-2">{title}</h2>
            <p className="text-[14px] text-[#4A5568] leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
    </PublicLayout>
  );
}
