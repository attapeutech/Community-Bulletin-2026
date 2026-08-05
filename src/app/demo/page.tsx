import type { Metadata } from "next";
import "./demo.css";

export const metadata: Metadata = {
  title: "Community Bulletin — Franchise Partner Opportunity",
  description:
    "See how Community Bulletin generates passive revenue for Grocery Outlet franchise owners through locally-targeted digital in-store ads.",
};

export default function DemoPage() {
  return (
    <div className="d-page">
      <nav className="d-nav" aria-label="Site navigation">
        <div className="d-nav-inner">
          <a href="/" className="d-nav-brand">Community <em>Bulletin</em></a>
          <a href="#contact" className="d-nav-cta">Schedule a Call</a>
        </div>
      </nav>

      <section className="d-hero">
        <div className="d-wrap d-hero-inner">
          <div>
            <div className="d-eyebrow">Franchise Partner Opportunity</div>
            <h1 className="d-h1">Your store.<br />Your community.<br />A new revenue stream.</h1>
            <p className="d-hero-sub">Community Bulletin places locally-targeted digital ads on screens inside your store — generating passive income while connecting your neighbors&rsquo; businesses to your customers.</p>
            <div className="d-hero-btns">
              <a href="https://communitybulletin.com/contact" className="d-btn-p">Schedule a 20-min Call</a>
              <a href="#how" className="d-btn-g">See how it works ↓</a>
            </div>
          </div>
          <div className="d-hero-vis">
            <div className="d-screen-wrap">
              <div className="d-screen-bezel" role="img" aria-label="Sample Community Bulletin display showing rotating local business ads">
                <div className="d-screen-inner">
                  <div className="d-s-ad d-s-ad-1">
                    <div className="d-s-cat" style={{color:"#4A90C4"}}>Health &amp; Wellness</div>
                    <div className="d-s-title" style={{color:"#1A3A5C"}}>Mountain View<br />Dental</div>
                    <div className="d-s-offer" style={{color:"#5A7A94"}}>New patient special — exam, X-rays &amp; cleaning for $89. Now accepting families.</div>
                  </div>
                  <div className="d-s-ad d-s-ad-2">
                    <div className="d-s-cat" style={{color:"#B45309"}}>Food &amp; Dining</div>
                    <div className="d-s-title" style={{color:"#3D2200"}}>Casa Veracruz<br />Mexican Grill</div>
                    <div className="d-s-offer" style={{color:"#78450E"}}>Lunch special Mon–Fri, 11am–3pm · $11.99. Fresh, authentic, family-owned.</div>
                  </div>
                  <div className="d-s-ad d-s-ad-3">
                    <div className="d-s-cat" style={{color:"#15803D"}}>Education</div>
                    <div className="d-s-title" style={{color:"#0D3D25"}}>Academic<br />Advantage</div>
                    <div className="d-s-offer" style={{color:"#166534"}}>Math &amp; science tutoring, grades 4–12. Free first session. Enrolling now.</div>
                  </div>
                  <div className="d-s-bar">
                    <div className="d-s-logo">Community Bulletin</div>
                    <div className="d-s-dots">
                      <div className="d-s-dot d-s-dot-on"></div>
                      <div className="d-s-dot"></div>
                      <div className="d-s-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-screen-stand"></div>
            </div>
          </div>
        </div>
      </section>

      <div className="d-marquee" aria-hidden="true">
        <div className="d-mq-track">
          <span className="d-mq-item">Dental &amp; Medical</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Restaurants &amp; Cafés</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Tutoring &amp; Education</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Real Estate</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Hair &amp; Beauty</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Auto Repair</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Gyms &amp; Fitness</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Tax &amp; Accounting</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Law Offices</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Home Services</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Insurance</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Child Care</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Dental &amp; Medical</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Restaurants &amp; Cafés</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Tutoring &amp; Education</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Real Estate</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Hair &amp; Beauty</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Auto Repair</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Gyms &amp; Fitness</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Tax &amp; Accounting</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Law Offices</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Home Services</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Insurance</span><span className="d-mq-sep">·</span>
          <span className="d-mq-item">Child Care</span><span className="d-mq-sep">·</span>
        </div>
      </div>

      <section className="d-opp">
        <div className="d-wrap">
          <div className="d-label">The Opportunity</div>
          <h2 className="d-h2">Local businesses want to reach your customers.<br />You&rsquo;re already where those customers are.</h2>
          <div className="d-opp-grid">
            <div className="d-opp-body">
              <p>Every week, thousands of people in your community walk through your store. They&rsquo;re your neighbors — and they&rsquo;re the same customers that local dentists, restaurants, tutors, and service businesses are trying to reach.</p>
              <p>Right now, those businesses spend money on mailers, Facebook ads, and print coupons — often missing their audience entirely. Community Bulletin changes that by placing their message exactly where their customers already are: inside your store.</p>
              <div className="d-pullquote">
                <p>&ldquo;Grocery Outlet shoppers visit 2–3 times per week. That repeat exposure is premium inventory that no flyer or Facebook post can match.&rdquo;</p>
              </div>
              <p>You provide the space. We handle everything else — the technology, advertiser recruitment, payment processing, content review, and 24/7 display operation. Your staff doesn&rsquo;t lift a finger.</p>
            </div>
            <div className="d-stat-col">
              <div className="d-stat-row">
                <div className="d-stat-num">2–3×</div>
                <div className="d-stat-lbl">Average weekly visits per Grocery Outlet shopper — one of the highest repeat-visit rates in grocery retail.</div>
              </div>
              <div className="d-stat-row">
                <div className="d-stat-num">$0</div>
                <div className="d-stat-lbl">Upfront cost to you. No hardware purchase, no subscription, no staff time required.</div>
              </div>
              <div className="d-stat-row">
                <div className="d-stat-num">100%</div>
                <div className="d-stat-lbl">Content reviewed before any ad appears in your store. You control what your customers see.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="d-how" id="how">
        <div className="d-wrap">
          <div className="d-how-hd">
            <div className="d-label">How It Works</div>
            <h2 className="d-h2">Three steps. Zero ongoing work from your team.</h2>
          </div>
          <div className="d-how-steps">
            <div>
              <div className="d-step-num">01</div>
              <div className="d-step-rule"></div>
              <div className="d-step-title">Set up a screen in your store</div>
              <div className="d-step-body">All you need is a standard flat-screen TV, a mini PC or streaming device, and a WiFi connection — equipment many stores already have. Set it up yourself and earn a 50% revenue share. If you&rsquo;d rather we handle the equipment and installation, that option is available too at a 25% share.</div>
            </div>
            <div>
              <div className="d-step-num">02</div>
              <div className="d-step-rule"></div>
              <div className="d-step-title">Local businesses submit ads online</div>
              <div className="d-step-body">Through CommunityBulletin.com, businesses create their ad, select your store, and pay securely online. Our team reviews every submission before approval — no inappropriate or competing content reaches your display.</div>
            </div>
            <div>
              <div className="d-step-num">03</div>
              <div className="d-step-rule"></div>
              <div className="d-step-title">Ads rotate automatically. Revenue arrives monthly.</div>
              <div className="d-step-body">Approved ads go live on your display in real time. The platform handles rotation, scheduling, and refresh automatically. You receive a monthly revenue report and payment — no action required.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="d-rev">
        <div className="d-wrap">
          <div className="d-rev-eyebrow">Revenue Potential</div>
          <h2 className="d-rev-h2">Passive income from space<br />you already own.</h2>
          <p className="d-rev-sub">Ad slots are priced at $100 per week per advertiser. Each location targets 40 active ads — that&rsquo;s $4,000/week in gross revenue per screen. Your share depends on one factor: who provides and sets up the display equipment.</p>
          <div className="d-rev-grid">
            <div className="d-rev-scenarios">
              <div className="d-rev-card d-rev-card-hi">
                <div className="d-rev-card-lbl">You provide &amp; set up the screen <span className="d-pref-badge">Preferred</span></div>
                <div className="d-rev-card-amt">$8,000<span className="d-rev-card-mo">/mo</span></div>
                <div className="d-rev-card-desc">50% revenue share · 40 active ads at $100/week · $96,000/year</div>
              </div>
              <div className="d-rev-card">
                <div className="d-rev-card-lbl">We provide &amp; install the screen</div>
                <div className="d-rev-card-amt">$4,000<span className="d-rev-card-mo">/mo</span></div>
                <div className="d-rev-card-desc">25% revenue share · 40 active ads at $100/week · $48,000/year</div>
              </div>
            </div>
            <div className="d-rev-detail">
              <p>Advertisers pay <strong style={{color:"#fff"}}>$100 per week</strong> per ad slot — a fraction of what print media or social advertising costs for comparable local reach. Each location targets <strong style={{color:"#fff"}}>40 active ads</strong>, generating $4,000 per week in gross revenue per screen.</p>
              <p>Your revenue share depends on one factor: <strong style={{color:"#fff"}}>who provides the display equipment.</strong> Store owners who supply a TV, mini PC, and WiFi — and handle the setup themselves — earn <strong style={{color:"#fff"}}>50% ($8,000/month)</strong>. When Community Bulletin provides and installs the equipment, the share is <strong style={{color:"#fff"}}>25% ($4,000/month)</strong> to offset our hardware and contractor costs.</p>
              <p>We strongly prefer the store-provides model. It eliminates the need for us to coordinate licensed contractors and specialized installation — keeping the partnership simple on both sides and putting significantly more money in your pocket.</p>
              <div className="d-rev-note">
                <strong>What &ldquo;providing your own equipment&rdquo; means:</strong><br />
                A standard flat-screen TV · a mini PC or streaming device · your existing WiFi connection. Most stores already have two of the three. That&rsquo;s all it takes to qualify for the 50% share.
              </div>
            </div>
          </div>
          <p style={{marginTop:"32px",fontSize:"12px",color:"rgba(255,255,255,.6)",lineHeight:"1.6"}}>
            <strong style={{color:"rgba(255,255,255,.8)"}}>Disclaimer:</strong> Revenue figures are projections based on full capacity (40 active ads at $100/week) — not a guarantee. Actual results will vary based on advertiser demand at your location.
          </p>
        </div>
      </section>

      <section className="d-plat">
        <div className="d-wrap">
          <div className="d-label">The Platform</div>
          <h2 className="d-h2">Fully built. Already operational.</h2>
          <div className="d-plat-grid">
            <div>
              <p className="d-plat-body">Community Bulletin isn&rsquo;t a concept waiting to be built — it&rsquo;s a complete, working platform. From the moment a business submits an ad to the moment it appears on your display, every step is automated and auditable.</p>
              <ul className="d-feat-list">
                <li className="d-feat-item">
                  <div className="d-feat-tick">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="d-feat-text">Web portal for local businesses to create, submit, and pay for ads — no phone call or manual process needed</div>
                </li>
                <li className="d-feat-item">
                  <div className="d-feat-tick">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="d-feat-text">Secure online payment via Stripe — advertisers are charged at submission, refunded automatically if denied</div>
                </li>
                <li className="d-feat-item">
                  <div className="d-feat-tick">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="d-feat-text">Human content review before any ad goes live — no inappropriate, deceptive, or competing content reaches your store</div>
                </li>
                <li className="d-feat-item">
                  <div className="d-feat-tick">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="d-feat-text">Real-time display refresh — approved ads appear immediately on your screen, with automatic rotation and scheduling</div>
                </li>
                <li className="d-feat-item">
                  <div className="d-feat-tick">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="d-feat-text">Partner dashboard with monthly revenue reports and a complete history of every ad displayed in your store</div>
                </li>
              </ul>
            </div>
            <div>
              <div className="d-mini-ui" role="img" aria-label="Screenshot of the Community Bulletin partner dashboard">
                <div className="d-mini-bar">
                  <div className="d-mini-dot"></div>
                  <div className="d-mini-dot"></div>
                  <div className="d-mini-dot"></div>
                  <div className="d-mini-url">communitybulletin.com · partner dashboard</div>
                </div>
                <div className="d-mini-body">
                  <div className="d-mini-sec">Active Ads — Lynnwood Store</div>
                  <div className="d-mini-card">
                    <div className="d-mini-img" style={{background:"#E4F2FF"}}></div>
                    <div className="d-mini-info">
                      <div className="d-mini-title">Mountain View Dental</div>
                      <div className="d-mini-meta">Jul 28 – Aug 11, 2026</div>
                    </div>
                    <div className="d-mini-badge d-b-live">Live</div>
                  </div>
                  <div className="d-mini-card">
                    <div className="d-mini-img" style={{background:"#FFF7E8"}}></div>
                    <div className="d-mini-info">
                      <div className="d-mini-title">Casa Veracruz Grill</div>
                      <div className="d-mini-meta">Aug 1 – Aug 15, 2026</div>
                    </div>
                    <div className="d-mini-badge d-b-live">Live</div>
                  </div>
                  <div className="d-mini-card">
                    <div className="d-mini-img" style={{background:"#EAFAF3"}}></div>
                    <div className="d-mini-info">
                      <div className="d-mini-title">Academic Advantage</div>
                      <div className="d-mini-meta">Submitted Aug 3, 2026</div>
                    </div>
                    <div className="d-mini-badge d-b-pend">In Review</div>
                  </div>
                  <div className="d-mini-rev">
                    <div className="d-mini-sec">August Revenue</div>
                    <div className="d-mini-rev-num">
                      $8,000<span style={{fontSize:"13px",color:"var(--d-text-faint)",fontFamily:"var(--d-sans)"}}>.00</span>
                    </div>
                    <div className="d-mini-rev-sub">40 active ads · $100/wk each · 50% share</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="d-fit">
        <div className="d-wrap">
          <div className="d-label">Why Grocery Outlet</div>
          <h2 className="d-h2">The right platform for the right store.</h2>
          <div className="d-fit-grid">
            <div className="d-fit-card">
              <div className="d-fit-card-title">High repeat traffic makes your display premium inventory</div>
              <div className="d-fit-card-body">Grocery Outlet shoppers visit more frequently than most grocery chains. That repeat exposure makes your display far more valuable to local advertisers than a one-time mailer or a social post — and they&rsquo;re willing to pay for it.</div>
            </div>
            <div className="d-fit-card">
              <div className="d-fit-card-title">Your customers are already in a local-services mindset</div>
              <div className="d-fit-card-body">People shopping for value are the same people looking for a dentist nearby, a place for after-school tutoring, a good family restaurant. They&rsquo;re receptive to local, relevant recommendations at exactly the right moment.</div>
            </div>
            <div className="d-fit-card">
              <div className="d-fit-card-title">Community Bulletin aligns with Grocery Outlet&rsquo;s brand values</div>
              <div className="d-fit-card-body">Grocery Outlet&rsquo;s position as a community-first, value-driven retailer makes it a natural fit. The platform extends that promise — your store becomes a hub connecting your neighborhood&rsquo;s businesses and residents.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="d-cta" id="contact">
        <div className="d-cta-inner">
          <div className="d-eyebrow">Ready to Talk?</div>
          <h2 className="d-cta-h2">See the platform live.<br />Ask us anything.</h2>
          <p className="d-cta-sub">A 20-minute call is all it takes to see Community Bulletin in action and understand exactly what a pilot at your store would look like — with no commitment required.</p>
          <div className="d-cta-btns">
            <a href="https://communitybulletin.com/contact" className="d-btn-xl">Schedule a Call</a>
            <a href="https://communitybulletin.com/contact" className="d-btn-sec">Send an Email</a>
          </div>
          <div className="d-contact-row">
            <div>
              <div className="d-c-lbl">Website</div>
              <div className="d-c-val">communitybulletin.com</div>
            </div>
            <div>
              <div className="d-c-lbl">Platform status</div>
              <div className="d-c-val">Live &amp; operational</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="d-footer">
        <div className="d-foot-inner">
          <a href="/" className="d-foot-brand">Community <em>Bulletin</em></a>
          <div className="d-foot-copy">© 2026 Community Bulletin. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
