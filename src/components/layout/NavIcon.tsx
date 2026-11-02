import {
  Banknote, CircleUser, ClipboardCheck, Globe, Handshake, Heart, Inbox, LayoutDashboard,
  LifeBuoy, Megaphone, Monitor, Sparkles, Store, Wallet, type LucideIcon,
} from "lucide-react";

// Dashboard menu icons, by name (the menu list is built on the server and passed to the phone menu,
// so it carries names rather than components)
const ICONS = {
  ads: Megaphone,
  saved: Heart,
  locations: Store,
  earnings: Wallet,
  review: ClipboardCheck,
  admin: LayoutDashboard,
  sales: Handshake,
  applications: Inbox,
  payouts: Banknote,
  screens: Monitor,
  geography: Globe,
  partner: Sparkles,
  account: CircleUser,
  help: LifeBuoy,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof ICONS;

export function NavIcon({ name }: { name: NavIconName }) {
  const Icon = ICONS[name];
  return <Icon size={17} strokeWidth={1.9} className="shrink-0 opacity-90" aria-hidden="true" />;
}
