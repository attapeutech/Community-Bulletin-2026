# CastEasy.io (CastEZ) — handoff package

## design-components/
Live HTML designs. Open any `.dc.html` in a browser (keep `support.js` beside them).

- CastEZ Landing.dc.html ......... marketing landing page (nav w/ location+search, bell,
                                   dark/light toggle, hero screen sim, audience bento,
                                   4-step flow, footer)
- CastEZ Login.dc.html
- CastEZ Register.dc.html
- CastEZ Forgot Password.dc.html
- CastEZ Location Dialog.dc.html . standalone preview of the Choose Location modal
- CastEZ Mobile Preview.dc.html .. the landing page in iPhone / Pixel / iPad frames
                                   plus a breakpoint cheat-sheet

## nextjs/
Next.js App Router + Tailwind source for the same designs.

    npx create-next-app@latest castez --ts --tailwind --app
    # copy app/ components/ tailwind.config.ts over the generated files
    npm run dev

Routes: `/`, `/login`, `/register`, `/forgot-password`.
Requires the `@/*` path alias and Tailwind v3.4+ (arbitrary `max-[860px]:` breakpoints).

### Responsive behaviour (landing page)

    <= 1180px  center nav links hide
    <= 1040px  flow steps 4-up -> 2-up
    <= 1000px  location + search control narrows
    <=  860px  search hides, location collapses to the pin icon
    <=  720px  bento panels stack, Log in hides
    <=  640px  nav becomes two rows (logo row + full-width location/search),
               neon CTA is replaced by a hamburger menu
    <=  560px  flow steps 1-up
    <=  420px  notification bell hides

Opening the hamburger hides the location/search row and drops a full-width panel
with Platform / How it works / Pricing / Log in / Get started free.

### Still to wire
- auth form submits are stubbed (`e.preventDefault()`)
- ChooseLocationDialog uses a static LOCATIONS map — swap for the screens API
- ScreenSimulation rotates local mock ads — replace with the Socket.io feed
- the Next.js Navbar ships dark-mode only; the dark/light toggle lives in the
  design component (port via Tailwind's `dark:` variant + next-themes)

## standalone/
CastEZ Landing.html — single self-contained file, works offline.
