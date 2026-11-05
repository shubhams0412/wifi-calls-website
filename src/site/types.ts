/* Content model for the marketing website. Every feature / use-case / country page is generated
   from these records (src/site/content/*), so adding a page = adding a record. */
import type { IconName } from '@/components/icons';

export interface Faq { q: string; a: string }
export interface Point { icon: IconName; title: string; text: string }
export interface Section { title: string; text: string; bullets?: string[] }

/** Common SEO fields. */
export interface Seo { seoTitle: string; seoDescription: string }

export type FeatureGroup = 'numbers' | 'calls' | 'messaging' | 'answering' | 'privacy';
export const FEATURE_GROUPS: Record<FeatureGroup, string> = {
  numbers: 'Your number',
  calls: 'Calls',
  messaging: 'Messaging',
  answering: 'Answering for you',
  privacy: 'Privacy & control',
};

export interface Feature extends Seo {
  slug: string;              // URL: /features/{slug}
  group: FeatureGroup;
  name: string;              // menu / card label, e.g. "Call recording"
  icon: IconName;
  short: string;             // one line for menus and cards (≤ 70 chars)
  title: string;             // page H1
  intro: string;             // 1–2 sentences under the H1
  pro?: boolean;             // true when the feature needs the Pro plan
  highlights: Point[];       // 3–4 benefit cards
  steps: string[];           // 3 "how it works" steps, in-app wording
  sections: Section[];       // 2 deeper explanation blocks
  faqs: Faq[];               // 3–4
  related: string[];         // 3 other feature slugs
}

export interface UseCase extends Seo {
  slug: string;              // URL: /use-cases/{slug}
  name: string;              // "Small business"
  icon: IconName;
  short: string;
  title: string;
  intro: string;
  problems: Point[];         // 3 situations / pains this solves
  features: string[];        // 4–6 feature slugs that matter for this audience
  sections: Section[];       // 2 blocks
  faqs: Faq[];
}

export interface NumberCountry extends Seo {
  slug: string;              // URL: /numbers/{slug}
  name: string; code: string; flag: string; dial: string;
  title: string;
  intro: string;
  areaCodes: { code: string; city: string }[];   // example area codes offered
  sections: Section[];
  faqs: Faq[];
}

export interface CallCountry extends Seo {
  slug: string;              // URL: /international-calling/{slug}
  name: string; code: string; flag: string; dial: string;
  title: string;             // e.g. "Call India from the US"
  intro: string;
  example: string;           // example of the full international number format
  tips: string[];            // 3 practical tips (time difference, mobile vs landline, free app calls…)
  faqs: Faq[];
}
