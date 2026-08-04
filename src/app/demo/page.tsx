import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Bulletin — Franchise Partner Opportunity",
  description:
    "See how Community Bulletin generates passive revenue for Grocery Outlet franchise owners through locally-targeted digital in-store ads.",
};

const css = `
:root {
  --navy: #1A3A5C;
  --navy-800: #112535;
  --navy-900: #0A1C2E;
  --coral: #E8563A;
  --coral-dark: #C94830;
  --sky: #4A90C4;
  --sky-light: #9DC4E0;
  --bg: #FAFCFE;
  --fog: #EEF4F9;
  --fog-mid: #D8E4EE;
  --text: #0D2035;
  --text-muted: #5A7A94;
  --text-faint: #9DB8CC;
  --surface: #ffffff;
  --font-serif: Georgia, "Times New Roman", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", "Fira Code", Consolas, monospace;
  --r: 8px;
  --w: 1100px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #07131F;
    --fog: #0D1F30;
    --fog-mid: #1A3048;
    --text: #D8EEF8;
    --text-muted: #6A9BB8;
    --text-faint: #2E5070;
    --surface: #0D1F30;
  }
}
:root[data-theme="dark"] {
  --bg: #07131F;
  --fog: #0D1F30;
  --fog-mid: #1A3048;
  --text: #D8EEF8;
  --text-muted: #6A9BB8;
  --text-faint: #2E5070;
  --surface: #0D1F30;
}
:root[data-theme="light"] {
  --bg: #FAFCFE;
  --fog: #EEF4F9;
  --fog-mid: #D8E4EE;
  --text: #0D2035;
  --text-muted: #5A7A94;
  --text-faint: #9DB8CC;
  --surface: #ffffff;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans) !important; background: var(--bg) !important; color: var(--text) !important; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }

.demo-wrap { max-width: var(--w); margin: 0 auto; padding: 0 40px; }
@media (max-width: 640px) { .demo-wrap { padding: 0 20px; } }

/* NAV */
.demo-nav { position: sticky; top: 0; z-index: 100; background: var(--bg); border-bottom: 1px solid var(--fog-mid); }
.demo-nav-inner { max-width: var(--w); margin: 0 auto; padding: 0 40px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.demo-nav-brand { font-family: var(--font-serif); font-size: 17px; color: var(--navy); letter-spacing: -0.01em; }
.demo-nav-brand em { color: var(--coral); font-style: normal; }
.demo-nav-cta { background: var(--coral); color: #fff; padding: 8px 18px; border-radius: var(--r); font-size: 13px; font-weight: 600; transition: background .15s; }
.demo-nav-cta:hover { background: var(--coral-dark); }
@media (max-width: 640px) { .demo-nav-inner { padding: 0 20px; } }

/* HERO */
.hero { padding: 84px 0 72px; }
.hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--coral); margin-bottom: 20px; }
.hero-h1 { font-family: var(--font-serif); font-size: clamp(38px, 5vw, 62px); line-height: 1.08; color: var(--navy); letter-spacing: -.025em; text-wrap: balance; margin-bottom: 24px; }
.hero-sub { font-size: 17px; color: var(--text-muted); line-height: 1.72; max-width: 460px; margin-bottom: 36px; }
.hero-btns { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.btn-p { background: var(--coral); color: #fff; padding: 13px 26px; border-radius: var(--r); font-weight: 600; font-size: 15px; transition: background .15s, transform .1s; display: inline-block; }
.btn-p:hover { background: var(--coral-dark); transform: translateY(-1px); }
.btn-g { color: var(--text-muted); font-size: 15px; border-bottom: 1px solid var(--fog-mid); padding-bottom: 1px; transition: color .15s; }
.btn-g:hover { color: var(--text); }

/* SCREEN MOCKUP */
.hero-vis { display: flex; justify-content: center; }
.screen-wrap { width: 100%; max-width: 400px; }
.screen-bezel { background: #071520; border-radius: 10px; padding: 7px; box-shadow: 0 20px 56px rgba(7,21,32,.35), 0 0 0 1px rgba(255,255,255,.06); aspect-ratio: 16/9; position: relative; }
.screen-inner { width: 100%; height: 100%; border-radius: 5px; overflow: hidden; position: relative; background: #0D1F35; }
.s-ad { position: absolute; inset: 0; padding: 18px 20px 38px; opacity: 0; }
.s-ad-1 { background: linear-gradient(140deg,#E4F2FF,#F0F8FF); animation: adFade 15s ease-in-out infinite 0s; }
.s-ad-2 { background: linear-gradient(140deg,#FFF7E8,#FFFCF0); animation: adFade 15s ease-in-out infinite 5s; }
.s-ad-3 { background: linear-gradient(140deg,#EAFAF3,#F4FDF8); animation: adFade 15s ease-in-out infinite 10s; }
@keyframes adFade { 0%{opacity:0} 8%{opacity:1} 28%{opacity:1} 36%{opacity:0} 100%{opacity:0} }
.s-cat { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 7px; }
.s-title { font-family: var(--font-serif); font-size: 17px; line-height: 1.2; font-weight: bold; margin-bottom: 5px; }
.s-offer { font-size: 11px; line-height: 1.45; opacity: .7; }
.s-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 22px; background: rgba(7,21,32,.88); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.s-logo { font-size: 8px; font-weight: 700; color: rgba(255,255,255,.55); letter-spacing: .1em; text-transform: uppercase; }
.s-dots { display: flex; gap: 4px; }
.s-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,.2); }
.s-dot.on { background: var(--coral); }
.screen-stand { width: 56px; height: 5px; background: #071520; margin: 0 auto; border-radius: 0 0 3px 3px; }

/* MARQUEE */
.marquee { background: var(--fog); border-top: 1px solid var(--fog-mid); border-bottom: 1px solid var(--fog-mid); overflow: hidden; padding: 11px 0; }
.marquee-track { display: flex; width: max-content; animation: mq 32s linear infinite; }
@keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.mq-item { white-space: nowrap; padding: 0 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--text-muted); }
.mq-sep { color: var(--coral); padding: 0 6px; }

/* SECTION COMMON */
.s-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--coral); margin-bottom: 18px; }
.s-h2 { font-family: var(--font-serif); font-size: clamp(26px, 3.2vw, 40px); color: var(--navy); line-height: 1.18; text-wrap: balance; letter-spacing: -.02em; }

/* OPPORTUNITY */
.opp { padding: 100px 0; }
.opp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 52px; }
.opp-body { font-size: 16px; color: var(--text-muted); line-height: 1.75; }
.opp-body p + p { margin-top: 16px; }
.pullquote { border-left: 3px solid var(--coral); padding-left: 22px; margin: 28px 0; }
.pullquote p { font-family: var(--font-serif); font-size: 19px; line-height: 1.5; color: var(--navy); font-style: italic; }
.stat-col { display: flex; flex-direction: column; gap: 0; }
.stat-row { padding: 28px 0; border-bottom: 1px solid var(--fog-mid); }
.stat-row:first-child { padding-top: 0; }
.stat-row:last-child { border-bottom: none; }
.stat-num { font-family: var(--font-serif); font-size: 52px; font-weight: bold; color: var(--navy); line-height: 1; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.stat-lbl { font-size: 13px; color: var(--text-muted); margin-top: 7px; line-height: 1.55; }

/* HOW IT WORKS */
.how { background: var(--fog); border-top: 1px solid var(--fog-mid); border-bottom: 1px solid var(--fog-mid); padding: 100px 0; }
.how-hd { margin-bottom: 56px; }
.how-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 48px; }
.step-num { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--coral); margin-bottom: 10px; }
.step-rule { width: 28px; height: 2px; background: var(--coral); margin-bottom: 18px; }
.step-title { font-family: var(--font-serif); font-size: 20px; color: var(--navy); line-height: 1.3; margin-bottom: 10px; letter-spacing: -.01em; }
.step-body { font-size: 14px; color: var(--text-muted); line-height: 1.7; }

/* REVENUE */
.rev { background: var(--navy-900); padding: 100px 0; }
.rev-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--coral); margin-bottom: 18px; }
.rev-h2 { font-family: var(--font-serif); font-size: clamp(26px, 3.2vw, 40px); color: #fff; line-height: 1.18; text-wrap: balance; letter-spacing: -.02em; margin-bottom: 14px; }
.rev-sub { color: var(--sky-light); font-size: 16px; line-height: 1.72; max-width: 540px; margin-bottom: 56px; }
.rev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
.rev-scenarios { display: flex; flex-direction: column; gap: 16px; }
.rev-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: var(--r); padding: 22px 24px; }
.rev-card.hi { border-color: rgba(232,86,58,.4); background: rgba(232,86,58,.08); }
.rev-card-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--sky-light); margin-bottom: 7px; }
.rev-card.hi .rev-card-lbl { color: var(--coral); }
.rev-card-amt { font-family: var(--font-serif); font-size: 32px; color: #fff; line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.rev-card-mo { font-size: 14px; color: var(--sky-light); margin-left: 4px; }
.rev-card-desc { font-size: 12px; color: rgba(255,255,255,.38); margin-top: 5px; }
.rev-detail { color: rgba(255,255,255,.62); font-size: 15px; line-height: 1.75; }
.rev-detail p + p { margin-top: 16px; }
.rev-note { margin-top: 24px; padding: 16px 20px; background: rgba(232,86,58,.1); border-left: 3px solid var(--coral); border-radius: 0 var(--r) var(--r) 0; font-size: 14px; color: rgba(255,255,255,.78); line-height: 1.6; }
.rev-pref-badge { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; background: var(--coral); color: #fff; padding: 2px 8px; border-radius: 20px; margin-left: 8px; vertical-align: middle; position: relative; top: -1px; }

/* PLATFORM */
.plat { padding: 100px 0; }
.plat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 52px; align-items: start; }
.plat-body { font-size: 16px; color: var(--text-muted); line-height: 1.75; margin-bottom: 28px; }
.feat-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.feat-item { display: flex; gap: 12px; align-items: flex-start; }
.feat-tick { width: 20px; height: 20px; border-radius: 50%; background: var(--fog); border: 1.5px solid var(--fog-mid); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.feat-text { font-size: 14px; color: var(--text); line-height: 1.55; }

/* MINI UI */
.mini-ui { background: var(--fog); border: 1px solid var(--fog-mid); border-radius: 10px; overflow: hidden; }
.mini-bar { background: var(--navy); padding: 9px 14px; display: flex; align-items: center; gap: 6px; }
.mini-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.18); }
.mini-url { font-size: 10px; color: rgba(255,255,255,.35); font-family: var(--font-mono); flex: 1; text-align: center; }
.mini-body { padding: 18px; }
.mini-sec { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-faint); margin-bottom: 10px; }
.mini-card { background: var(--surface); border: 1px solid var(--fog-mid); border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; display: flex; gap: 10px; align-items: center; }
.mini-img { width: 34px; height: 24px; border-radius: 3px; flex-shrink: 0; }
.mini-info { flex: 1; min-width: 0; }
.mini-title { font-size: 11px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.mini-meta { font-size: 10px; color: var(--text-faint); }
.mini-badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; flex-shrink: 0; }
.b-live { background: #E8F8F0; color: #15803D; border: 1px solid #BBF7D0; }
.b-pend { background: #FFF9E6; color: #92400E; border: 1px solid #FDE68A; }
.mini-rev { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--fog-mid); }
.mini-rev-num { font-family: var(--font-serif); font-size: 26px; color: var(--navy); letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.mini-rev-sub { font-size: 10px; color: var(--text-faint); margin-top: 3px; }

/* FIT */
.fit { background: var(--fog); border-top: 1px solid var(--fog-mid); border-bottom: 1px solid var(--fog-mid); padding: 100px 0; }
.fit-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 32px; margin-top: 52px; }
.fit-card { background: var(--surface); border: 1px solid var(--fog-mid); border-radius: var(--r); padding: 28px 30px; }
.fit-card-title { font-family: var(--font-serif); font-size: 18px; color: var(--navy); line-height: 1.3; margin-bottom: 10px; }
.fit-card-body { font-size: 14px; color: var(--text-muted); line-height: 1.65; }

/* CTA */
.cta-sec { padding: 120px 0; }
.cta-inner { max-width: 660px; margin: 0 auto; padding: 0 40px; text-align: center; }
.cta-h2 { font-family: var(--font-serif); font-size: clamp(30px, 4vw, 48px); color: var(--navy); line-height: 1.15; text-wrap: balance; letter-spacing: -.02em; margin-bottom: 18px; }
.cta-sub { font-size: 16px; color: var(--text-muted); line-height: 1.72; margin-bottom: 36px; }
.cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.btn-xl { background: var(--coral); color: #fff; padding: 15px 34px; border-radius: var(--r); font-weight: 600; font-size: 16px; transition: background .15s, transform .1s; display: inline-block; }
.btn-xl:hover { background: var(--coral-dark); transform: translateY(-1px); }
.btn-sec { background: var(--fog); color: var(--navy); padding: 15px 28px; border-radius: var(--r); font-weight: 600; font-size: 16px; border: 1px solid var(--fog-mid); transition: background .15s; display: inline-block; }
.btn-sec:hover { background: var(--fog-mid); }
.contact-row { margin-top: 44px; padding-top: 44px; border-top: 1px solid var(--fog-mid); display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; text-align: left; }
.c-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--text-faint); margin-bottom: 5px; }
.c-val { font-size: 14px; color: var(--text-muted); }
@media (max-width: 640px) {
  .contact-row { grid-template-columns: 1fr; }
  .cta-inner { padding: 0 20px; }
}

/* FOOTER */
.demo-footer { background: var(--navy-900); padding: 36px 0; }
.foot-inner { max-width: var(--w); margin: 0 auto; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.foot-brand { font-family: var(--font-serif); font-size: 15px; color: rgba(255,255,255,.65); }
.foot-brand em { color: var(--coral); font-style: normal; }
.foot-copy { font-size: 12px; color: rgba(255,255,255,.3); }
@media (max-width: 640px) { .foot-inner { padding: 0 20px; } }

/* RESPONSIVE */
@media (max-width: 900px) {
  .hero-inner { grid-template-columns: 1fr; gap: 48px; }
  .hero-vis { justify-content: flex-start; }
  .screen-wrap { max-width: 360px; }
  .opp-grid { grid-template-columns: 1fr; gap: 48px; }
  .how-steps { grid-template-columns: 1fr; gap: 36px; }
  .rev-grid { grid-template-columns: 1fr; gap: 48px; }
  .plat-grid { grid-template-columns: 1fr; gap: 48px; }
  .fit-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .hero { padding: 60px 0 56px; }
  .opp,.how,.rev,.plat,.fit,.cta-sec { padding: 72px 0; }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
  .s-ad { animation: none !important; }
  .s-ad-1 { opacity: 1; }
  .btn-p:hover,.btn-xl:hover { transform: none; }
}
`;

const html = `
<nav class="demo-nav" aria-label="Site navigation">
  <div class="demo-nav-inner">
    <div class="demo-nav-brand">Community <em>Bulletin</em></div>
    <a href="#contact" class="demo-nav-cta">Schedule a Call</a>
  </div>
</nav>

<section class="hero">
  <div class="demo-wrap hero-inner">
    <div class="hero-text">
      <div class="eyebrow">Franchise Partner Opportunity</div>
      <h1 class="hero-h1">Your store.<br>Your community.<br>A new revenue stream.</h1>
      <p class="hero-sub">Community Bulletin places locally-targeted digital ads on screens inside your store — generating passive income while connecting your neighbors' businesses to your customers.</p>
      <div class="hero-btns">
        <a href="#contact" class="btn-p">Schedule a 20-min Call</a>
        <a href="#how" class="btn-g">See how it works ↓</a>
      </div>
    </div>
    <div class="hero-vis">
      <div class="screen-wrap">
        <div class="screen-bezel" role="img" aria-label="Sample Community Bulletin display showing rotating local business ads">
          <div class="screen-inner">
            <div class="s-ad s-ad-1">
              <div class="s-cat" style="color:#4A90C4;">Health &amp; Wellness</div>
              <div class="s-title" style="color:#1A3A5C;">Mountain View<br>Dental</div>
              <div class="s-offer" style="color:#5A7A94;">New patient special — exam, X-rays &amp; cleaning for $89. Now accepting families.</div>
            </div>
            <div class="s-ad s-ad-2">
              <div class="s-cat" style="color:#B45309;">Food &amp; Dining</div>
              <div class="s-title" style="color:#3D2200;">Casa Veracruz<br>Mexican Grill</div>
              <div class="s-offer" style="color:#78450E;">Lunch special Mon–Fri, 11am–3pm · $11.99. Fresh, authentic, family-owned.</div>
            </div>
            <div class="s-ad s-ad-3">
              <div class="s-cat" style="color:#15803D;">Education</div>
              <div class="s-title" style="color:#0D3D25;">Academic<br>Advantage</div>
              <div class="s-offer" style="color:#166534;">Math &amp; science tutoring, grades 4–12. Free first session. Enrolling now.</div>
            </div>
            <div class="s-bar">
              <div class="s-logo">Community Bulletin</div>
              <div class="s-dots"><div class="s-dot on"></div><div class="s-dot"></div><div class="s-dot"></div></div>
            </div>
          </div>
        </div>
        <div class="screen-stand"></div>
      </div>
    </div>
  </div>
</section>

<div class="marquee" aria-hidden="true">
  <div class="marquee-track">
    <span class="mq-item">Dental &amp; Medical</span><span class="mq-sep">·</span><span class="mq-item">Restaurants &amp; Cafés</span><span class="mq-sep">·</span><span class="mq-item">Tutoring &amp; Education</span><span class="mq-sep">·</span><span class="mq-item">Real Estate</span><span class="mq-sep">·</span><span class="mq-item">Hair &amp; Beauty</span><span class="mq-sep">·</span><span class="mq-item">Auto Repair</span><span class="mq-sep">·</span><span class="mq-item">Gyms &amp; Fitness</span><span class="mq-sep">·</span><span class="mq-item">Tax &amp; Accounting</span><span class="mq-sep">·</span><span class="mq-item">Law Offices</span><span class="mq-sep">·</span><span class="mq-item">Home Services</span><span class="mq-sep">·</span><span class="mq-item">Insurance</span><span class="mq-sep">·</span><span class="mq-item">Child Care</span><span class="mq-sep">·</span>
    <span class="mq-item">Dental &amp; Medical</span><span class="mq-sep">·</span><span class="mq-item">Restaurants &amp; Cafés</span><span class="mq-sep">·</span><span class="mq-item">Tutoring &amp; Education</span><span class="mq-sep">·</span><span class="mq-item">Real Estate</span><span class="mq-sep">·</span><span class="mq-item">Hair &amp; Beauty</span><span class="mq-sep">·</span><span class="mq-item">Auto Repair</span><span class="mq-sep">·</span><span class="mq-item">Gyms &amp; Fitness</span><span class="mq-sep">·</span><span class="mq-item">Tax &amp; Accounting</span><span class="mq-sep">·</span><span class="mq-item">Law Offices</span><span class="mq-sep">·</span><span class="mq-item">Home Services</span><span class="mq-sep">·</span><span class="mq-item">Insurance</span><span class="mq-sep">·</span><span class="mq-item">Child Care</span><span class="mq-sep">·</span>
  </div>
</div>

<section class="opp">
  <div class="demo-wrap">
    <div class="s-label">The Opportunity</div>
    <h2 class="s-h2">Local businesses want to reach your customers.<br>You're already where those customers are.</h2>
    <div class="opp-grid">
      <div class="opp-body">
        <p>Every week, thousands of people in your community walk through your store. They're your neighbors — and they're the same customers that local dentists, restaurants, tutors, and service businesses are trying to reach.</p>
        <p>Right now, those businesses spend money on mailers, Facebook ads, and print coupons — often missing their audience entirely. Community Bulletin changes that by placing their message exactly where their customers already are: inside your store.</p>
        <div class="pullquote">
          <p>"Grocery Outlet shoppers visit 2–3 times per week. That repeat exposure is premium inventory that no flyer or Facebook post can match."</p>
        </div>
        <p>You provide the space. We handle everything else — the technology, advertiser recruitment, payment processing, content review, and 24/7 display operation. Your staff doesn't lift a finger.</p>
      </div>
      <div class="stat-col">
        <div class="stat-row">
          <div class="stat-num">2–3×</div>
          <div class="stat-lbl">Average weekly visits per Grocery Outlet shopper — one of the highest repeat-visit rates in grocery retail.</div>
        </div>
        <div class="stat-row">
          <div class="stat-num">$0</div>
          <div class="stat-lbl">Upfront cost to you. No hardware purchase, no subscription, no staff time required.</div>
        </div>
        <div class="stat-row">
          <div class="stat-num">100%</div>
          <div class="stat-lbl">Content reviewed before any ad appears in your store. You control what your customers see.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="how" id="how">
  <div class="demo-wrap">
    <div class="how-hd">
      <div class="s-label">How It Works</div>
      <h2 class="s-h2">Three steps. Zero ongoing work from your team.</h2>
    </div>
    <div class="how-steps">
      <div>
        <div class="step-num">01</div>
        <div class="step-rule"></div>
        <div class="step-title">Set up a screen in your store</div>
        <div class="step-body">All you need is a standard flat-screen TV, a mini PC or streaming device, and a WiFi connection — equipment many stores already have. Set it up yourself and earn a 50% revenue share. If you'd rather we handle the equipment and installation, that option is available too at a 25% share.</div>
      </div>
      <div>
        <div class="step-num">02</div>
        <div class="step-rule"></div>
        <div class="step-title">Local businesses submit ads online</div>
        <div class="step-body">Through CommunityBulletin.com, businesses create their ad, select your store, and pay securely online. Our team reviews every submission before approval — no inappropriate or competing content reaches your display.</div>
      </div>
      <div>
        <div class="step-num">03</div>
        <div class="step-rule"></div>
        <div class="step-title">Ads rotate automatically. Revenue arrives monthly.</div>
        <div class="step-body">Approved ads go live on your display in real time. The platform handles rotation, scheduling, and refresh automatically. You receive a monthly revenue report and payment — no action required.</div>
      </div>
    </div>
  </div>
</section>

<section class="rev">
  <div class="demo-wrap">
    <div class="rev-eyebrow">Revenue Potential</div>
    <h2 class="rev-h2">Passive income from space<br>you already own.</h2>
    <p class="rev-sub">Ad slots are priced at $100 per week per advertiser. Each location targets 40 active ads — that's $4,000/week in gross revenue per screen. Your share depends on one factor: who provides and sets up the display equipment.</p>
    <div class="rev-grid">
      <div class="rev-scenarios">
        <div class="rev-card hi">
          <div class="rev-card-lbl">You provide &amp; set up the screen <span class="rev-pref-badge">Preferred</span></div>
          <div class="rev-card-amt">$8,000<span class="rev-card-mo">/mo</span></div>
          <div class="rev-card-desc">50% revenue share · 40 active ads at $100/week · $96,000/year</div>
        </div>
        <div class="rev-card">
          <div class="rev-card-lbl">We provide &amp; install the screen</div>
          <div class="rev-card-amt">$4,000<span class="rev-card-mo">/mo</span></div>
          <div class="rev-card-desc">25% revenue share · 40 active ads at $100/week · $48,000/year</div>
        </div>
      </div>
      <div class="rev-detail">
        <p>Advertisers pay <strong style="color:#fff;">$100 per week</strong> per ad slot — a fraction of what print media or social advertising costs for comparable local reach. Each location targets <strong style="color:#fff;">40 active ads</strong>, generating $4,000 per week in gross revenue per screen.</p>
        <p>Your revenue share depends on one factor: <strong style="color:#fff;">who provides the display equipment.</strong> Store owners who supply a TV, mini PC, and WiFi — and handle the setup themselves — earn <strong style="color:#fff;">50% ($8,000/month)</strong>. When Community Bulletin provides and installs the equipment, the share is <strong style="color:#fff;">25% ($4,000/month)</strong> to offset our hardware and contractor costs.</p>
        <p>We strongly prefer the store-provides model. It eliminates the need for us to coordinate licensed contractors and specialized installation — keeping the partnership simple on both sides and putting significantly more money in your pocket.</p>
        <div class="rev-note">
          <strong>What "providing your own equipment" means:</strong><br>
          A standard flat-screen TV · a mini PC or streaming device · your existing WiFi connection. Most stores already have two of the three. That's all it takes to qualify for the 50% share.
        </div>
      </div>
    </div>
  </div>
</section>

<section class="plat">
  <div class="demo-wrap">
    <div class="s-label">The Platform</div>
    <h2 class="s-h2">Fully built. Already operational.</h2>
    <div class="plat-grid">
      <div>
        <p class="plat-body">Community Bulletin isn't a concept waiting to be built — it's a complete, working platform. From the moment a business submits an ad to the moment it appears on your display, every step is automated and auditable.</p>
        <ul class="feat-list">
          <li class="feat-item">
            <div class="feat-tick"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="feat-text">Web portal for local businesses to create, submit, and pay for ads — no phone call or manual process needed</div>
          </li>
          <li class="feat-item">
            <div class="feat-tick"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="feat-text">Secure online payment via Stripe — advertisers are charged at submission, refunded automatically if denied</div>
          </li>
          <li class="feat-item">
            <div class="feat-tick"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="feat-text">Human content review before any ad goes live — no inappropriate, deceptive, or competing content reaches your store</div>
          </li>
          <li class="feat-item">
            <div class="feat-tick"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="feat-text">Real-time display refresh — approved ads appear immediately on your screen, with automatic rotation and scheduling</div>
          </li>
          <li class="feat-item">
            <div class="feat-tick"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#4A90C4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="feat-text">Partner dashboard with monthly revenue reports and a complete history of every ad displayed in your store</div>
          </li>
        </ul>
      </div>
      <div>
        <div class="mini-ui" role="img" aria-label="Screenshot of the Community Bulletin partner dashboard">
          <div class="mini-bar">
            <div class="mini-dot"></div><div class="mini-dot"></div><div class="mini-dot"></div>
            <div class="mini-url">communitybulletin.com · partner dashboard</div>
          </div>
          <div class="mini-body">
            <div class="mini-sec">Active Ads — Lynnwood Store</div>
            <div class="mini-card">
              <div class="mini-img" style="background:#E4F2FF;"></div>
              <div class="mini-info"><div class="mini-title">Mountain View Dental</div><div class="mini-meta">Jul 28 – Aug 11, 2026</div></div>
              <div class="mini-badge b-live">Live</div>
            </div>
            <div class="mini-card">
              <div class="mini-img" style="background:#FFF7E8;"></div>
              <div class="mini-info"><div class="mini-title">Casa Veracruz Grill</div><div class="mini-meta">Aug 1 – Aug 15, 2026</div></div>
              <div class="mini-badge b-live">Live</div>
            </div>
            <div class="mini-card">
              <div class="mini-img" style="background:#EAFAF3;"></div>
              <div class="mini-info"><div class="mini-title">Academic Advantage</div><div class="mini-meta">Submitted Aug 3, 2026</div></div>
              <div class="mini-badge b-pend">In Review</div>
            </div>
            <div class="mini-rev">
              <div class="mini-sec">August Revenue</div>
              <div class="mini-rev-num">$8,000<span style="font-size:13px;color:var(--text-faint);font-family:var(--font-sans);">.00</span></div>
              <div class="mini-rev-sub">40 active ads · $100/wk each · 50% share</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="fit">
  <div class="demo-wrap">
    <div class="s-label">Why Grocery Outlet</div>
    <h2 class="s-h2">The right platform for the right store.</h2>
    <div class="fit-grid">
      <div class="fit-card">
        <div class="fit-card-title">High repeat traffic makes your display premium inventory</div>
        <div class="fit-card-body">Grocery Outlet shoppers visit more frequently than most grocery chains. That repeat exposure makes your display far more valuable to local advertisers than a one-time mailer or a social post — and they're willing to pay for it.</div>
      </div>
      <div class="fit-card">
        <div class="fit-card-title">Your customers are already in a local-services mindset</div>
        <div class="fit-card-body">People shopping for value are the same people looking for a dentist nearby, a place for after-school tutoring, a good family restaurant. They're receptive to local, relevant recommendations at exactly the right moment.</div>
      </div>
      <div class="fit-card">
        <div class="fit-card-title">Community Bulletin aligns with Grocery Outlet's brand values</div>
        <div class="fit-card-body">Grocery Outlet's position as a community-first, value-driven retailer makes it a natural fit. The platform extends that promise — your store becomes a hub connecting your neighborhood's businesses and residents.</div>
      </div>
      <div class="fit-card">
        <div class="fit-card-title">Each franchise operates independently — you partner directly</div>
        <div class="fit-card-body">Because Grocery Outlet franchises operate as independent businesses, you can partner with us directly and on your terms. No waiting for corporate approval, no one-size-fits-all rollout. We tailor the program to your store and your community.</div>
      </div>
    </div>
  </div>
</section>

<section class="cta-sec" id="contact">
  <div class="cta-inner">
    <div class="eyebrow">Ready to Talk?</div>
    <h2 class="cta-h2">See the platform live.<br>Ask us anything.</h2>
    <p class="cta-sub">A 20-minute call is all it takes to see Community Bulletin in action and understand exactly what a pilot at your store would look like — with no commitment required.</p>
    <div class="cta-btns">
      <a href="mailto:hello@communitybulletin.com" class="btn-xl">Schedule a Call</a>
      <a href="mailto:hello@communitybulletin.com" class="btn-sec">Send an Email</a>
    </div>
    <div class="contact-row">
      <div>
        <div class="c-lbl">Email</div>
        <div class="c-val">hello@communitybulletin.com</div>
      </div>
      <div>
        <div class="c-lbl">Website</div>
        <div class="c-val">communitybulletin.com</div>
      </div>
      <div>
        <div class="c-lbl">Platform status</div>
        <div class="c-val">Live &amp; operational</div>
      </div>
    </div>
  </div>
</section>

<footer class="demo-footer">
  <div class="foot-inner">
    <div class="foot-brand">Community <em>Bulletin</em></div>
    <div class="foot-copy">© 2026 Community Bulletin. All rights reserved.</div>
  </div>
</footer>
`;

export default function DemoPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
