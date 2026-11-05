/* Navigation + footer data, built from the content records so new pages appear automatically. */
import { FEATURES } from './content/features';
import { USE_CASES } from './content/useCases';
import { CALL_COUNTRIES, NUMBER_COUNTRIES } from './content/countries';
import { FEATURE_GROUPS, type FeatureGroup } from './types';
import type { IconName } from '@/components/icons';

export interface MenuLink { href: string; label: string; sub?: string; icon?: IconName; flag?: string; pro?: boolean }
export interface MenuGroup { title: string; links: MenuLink[] }
export interface Menu {
  features: MenuGroup[];
  useCases: MenuLink[];
  numbers: MenuLink[];
  calling: MenuLink[];
}

export function buildMenu(): Menu {
  const groups = Object.keys(FEATURE_GROUPS) as FeatureGroup[];
  return {
    features: groups.map((g) => ({
      title: FEATURE_GROUPS[g],
      links: FEATURES.filter((f) => f.group === g).map((f) => ({ href: `/features/${f.slug}`, label: f.name, sub: f.short, icon: f.icon, pro: f.pro })),
    })).filter((g) => g.links.length),
    useCases: USE_CASES.map((u) => ({ href: `/use-cases/${u.slug}`, label: u.name, sub: u.short, icon: u.icon })),
    numbers: NUMBER_COUNTRIES.map((c) => ({ href: `/numbers/${c.slug}`, label: `${c.name} numbers`, flag: c.flag })),
    calling: CALL_COUNTRIES.slice(0, 8).map((c) => ({ href: `/international-calling/${c.slug}`, label: `Call ${c.name}`, flag: c.flag })),
  };
}
