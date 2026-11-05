/* Country pages.
   - NUMBER_COUNTRIES → /numbers/{slug}: countries where the app offers phone numbers (US, Canada).
   - CALL_COUNTRIES   → /international-calling/{slug}: popular destinations to call.
   No rates are published here — per-country costs are shown in the app ("See per-minute charges"). */
import type { CallCountry, NumberCountry } from '../types';

export const NUMBER_COUNTRIES: NumberCountry[] = [
  {
    slug: 'united-states',
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    dial: '+1',
    title: 'Get a US phone number on your iPhone',
    intro:
      'Pick a United States number in the app and start calling and texting from it over Wi-Fi or mobile data — no second SIM, no carrier contract.',
    seoTitle: 'Get a Second US Phone Number on iPhone',
    seoDescription:
      'Choose a US phone number in the Wi-Fi Calling & Texting app and use it for calls and SMS over Wi-Fi or data. Pick from available area codes, no second SIM.',
    areaCodes: [
      { code: '212', city: 'New York, NY' },
      { code: '310', city: 'Los Angeles, CA' },
      { code: '312', city: 'Chicago, IL' },
      { code: '415', city: 'San Francisco, CA' },
      { code: '512', city: 'Austin, TX' },
      { code: '617', city: 'Boston, MA' },
      { code: '206', city: 'Seattle, WA' },
      { code: '786', city: 'Miami, FL' },
    ],
    sections: [
      {
        title: 'How getting a US number works',
        text: 'After you subscribe, open “Get a phone number”, choose USA and pick one of the numbers listed. The list shows the numbers available at that moment, each with its city and state, and every number supports both voice and SMS.',
        bullets: ['Choose from the numbers available right now', 'Voice and SMS on every number', 'Ready to use as soon as you confirm'],
      },
      {
        title: 'What you can do with it',
        text: 'Call and text any US number from your new line, call other countries with coins, and talk to other app users for free.',
        bullets: ['Calls and SMS to US numbers', 'Free app-to-app calls, video calls and chat', 'Voicemail, forwarding and recording with Pro'],
      },
    ],
    faqs: [
      { q: 'Can I choose a specific area code?', a: 'You choose from the US numbers available in the app at the time, and each shows its city and state. The area codes on offer change as numbers are taken, so the examples on this page aren’t guaranteed.' },
      { q: 'Do I need to live in the US?', a: 'No. The app works anywhere with an internet connection, so you can use a US number while living or traveling elsewhere.' },
      { q: 'Is a subscription required?', a: 'Yes. A Lite or Pro subscription is needed to get a phone number. Calls and texts to regular numbers then use coins from your balance.' },
    ],
  },
  {
    slug: 'canada',
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    dial: '+1',
    title: 'Get a Canadian phone number on your iPhone',
    intro:
      'Choose a Canadian number in the app and use it for calls and texts over Wi-Fi or mobile data — handy for local contacts, listings and work, wherever you are.',
    seoTitle: 'Get a Second Canadian Phone Number',
    seoDescription:
      'Pick a Canadian phone number in the Wi-Fi Calling & Texting app and call or text over Wi-Fi or data. Choose numbers in Toronto, Vancouver and more.',
    areaCodes: [
      { code: '416', city: 'Toronto, ON' },
      { code: '604', city: 'Vancouver, BC' },
      { code: '514', city: 'Montréal, QC' },
      { code: '403', city: 'Calgary, AB' },
      { code: '613', city: 'Ottawa, ON' },
      { code: '780', city: 'Edmonton, AB' },
    ],
    sections: [
      {
        title: 'How getting a Canadian number works',
        text: 'After you subscribe, open “Get a phone number”, switch to CANADA and choose from the numbers listed. Each one shows its city and province and supports both voice and SMS.',
        bullets: ['Switch the picker to Canada', 'Pick from the numbers available right now', 'Voice and SMS on every number'],
      },
      {
        title: 'Built for life across borders',
        text: 'Canada and the US share the +1 country code, so your Canadian number can call and text US numbers too. Calls to regular numbers use coins, and calls between app users are free.',
        bullets: ['Calls and SMS to Canadian and US numbers', 'Free app-to-app calls and chat'],
      },
    ],
    faqs: [
      { q: 'Which Canadian cities can I get a number in?', a: 'You choose from the Canadian numbers available in the app when you sign up. The cities on this page are examples; availability changes over time.' },
      { q: 'Can I have a Canadian number if I live in the US?', a: 'Yes. The app works anywhere with an internet connection, so you can pick a Canadian number wherever you live.' },
      { q: 'Can I call US numbers from a Canadian number?', a: 'Yes. Calls and texts to regular numbers use coins, and the in-app rates screen shows the cost for each country.' },
    ],
  },
];

/** Shared tip: dialing from the app. */
const DIAL_TIP = (name: string) =>
  `In the Dial tab, tap the country button, pick ${name} (or search for it), then type the local number without the leading zero.`;
const APP_TIP = 'If the person you’re calling also uses Wi-Fi Calling & Texting, call or video call them from App Calls instead — app-to-app calls are free and don’t use coins.';
const RATE_TIP = 'Calls to regular phone numbers use coins. Check the cost first: Settings → Purchase Coins → Add coins → “See per-minute charges”.';

export const CALL_COUNTRIES: CallCountry[] = [
  {
    slug: 'india', name: 'India', code: 'IN', flag: '🇮🇳', dial: '+91',
    title: 'Call India from the US',
    intro: 'Call family and friends in India over Wi-Fi or data from your second number — or call them free if they use the app too.',
    example: '+91 98765 43210',
    seoTitle: 'Call India From the US Over Wi-Fi',
    seoDescription: 'Call mobiles and landlines in India from your iPhone over Wi-Fi. Dial +91 with the country picker, check rates in the app, or call app users in India for free.',
    tips: [
      'India is 9½ to 10½ hours ahead of US Eastern Time, depending on daylight saving — mornings in the US are evenings in India.',
      DIAL_TIP('India') + ' Indian mobile numbers have 10 digits after +91.',
      APP_TIP,
    ],
    faqs: [
      { q: 'How do I dial an Indian mobile number?', a: 'Choose India (+91) in the country picker and enter the 10-digit mobile number, without the leading 0.' },
      { q: 'How much does it cost to call India?', a: 'Calls to regular numbers use coins. The current cost per minute for India is shown in the app under “See per-minute charges”.' },
      { q: 'Can I call India for free?', a: 'Yes, if the person in India also uses the app. Calls, video calls and chats between app users are free.' },
    ],
  },
  {
    slug: 'mexico', name: 'Mexico', code: 'MX', flag: '🇲🇽', dial: '+52',
    title: 'Call Mexico from the US',
    intro: 'Reach mobiles and landlines across Mexico over Wi-Fi or data, and talk free with anyone there who uses the app.',
    example: '+52 55 1234 5678',
    seoTitle: 'Call Mexico From the US Over Wi-Fi',
    seoDescription: 'Call Mexico from your iPhone over Wi-Fi or data. Pick +52 in the country picker, check per-minute coin rates in the app, or call app users in Mexico for free.',
    tips: [
      'Most of Mexico is on Central Time — the same as Chicago for much of the year — so calling is easy across US time zones.',
      DIAL_TIP('Mexico') + ' Mexican numbers have 10 digits after +52.',
      APP_TIP,
    ],
    faqs: [
      { q: 'Do I need to add a 1 for Mexican mobiles?', a: 'No. Since 2019 Mexican mobiles and landlines are dialed the same way: +52 followed by the 10-digit number.' },
      { q: 'How much does it cost to call Mexico?', a: 'Calls to regular numbers use coins, and the per-minute cost for Mexico is listed in the app under “See per-minute charges”.' },
      { q: 'Can I text Mexican numbers?', a: 'You can send SMS to regular numbers using coins; the SMS rate for each country is shown on the same rates screen in the app.' },
    ],
  },
  {
    slug: 'philippines', name: 'the Philippines', code: 'PH', flag: '🇵🇭', dial: '+63',
    title: 'Call the Philippines from the US',
    intro: 'Stay close to family in the Philippines with calls over Wi-Fi or data from your second number — free when they’re on the app too.',
    example: '+63 917 123 4567',
    seoTitle: 'Call the Philippines From the US',
    seoDescription: 'Call the Philippines from your iPhone over Wi-Fi. Dial +63 with the country picker, see coin rates in the app, or video call family who use the app for free.',
    tips: [
      'The Philippines is 12 to 16 hours ahead of the US mainland — an evening call from the US reaches them the next morning.',
      DIAL_TIP('the Philippines') + ' Mobile numbers start with 9 after +63 (for example +63 917…).',
      APP_TIP,
    ],
    faqs: [
      { q: 'How do I call a Philippine mobile?', a: 'Choose the Philippines (+63) in the country picker and enter the number without the leading 0 — for example 917 123 4567.' },
      { q: 'Can I video call family in the Philippines?', a: 'Yes, if they use the app. Video calls between app users are free over Wi-Fi or data.' },
      { q: 'How much does it cost to call the Philippines?', a: 'Calls to regular numbers use coins. The per-minute cost is shown in the app under “See per-minute charges”.' },
    ],
  },
  {
    slug: 'united-kingdom', name: 'the United Kingdom', code: 'GB', flag: '🇬🇧', dial: '+44',
    title: 'Call the UK from the US',
    intro: 'Call UK mobiles and landlines from your second number over Wi-Fi or data, or call app users in the UK for free.',
    example: '+44 7700 900123',
    seoTitle: 'Call the UK From the US Over Wi-Fi',
    seoDescription: 'Call UK mobiles and landlines from your iPhone over Wi-Fi or data. Pick +44, drop the leading 0, check coin rates in the app, or call UK app users free.',
    tips: [
      'The UK is 5 hours ahead of US Eastern Time for most of the year, but the clocks change on different dates, so the gap is briefly 4 hours in spring and fall.',
      DIAL_TIP('the United Kingdom') + ' UK mobiles start with 7 after +44.',
      APP_TIP,
    ],
    faqs: [
      { q: 'Do I keep the 0 at the start of a UK number?', a: 'No. A UK number written as 07700 900123 is dialed internationally as +44 7700 900123.' },
      { q: 'How much does it cost to call the UK?', a: 'Calls to regular numbers use coins, and the cost depends on the country. See the current UK rate in the app under “See per-minute charges”.' },
      { q: 'Can I call UK landlines as well as mobiles?', a: 'Yes. Enter the number after +44 without the leading 0, for either a mobile or a landline.' },
    ],
  },
  {
    slug: 'pakistan', name: 'Pakistan', code: 'PK', flag: '🇵🇰', dial: '+92',
    title: 'Call Pakistan from the US',
    intro: 'Call relatives and colleagues in Pakistan over Wi-Fi or data from your second number, or free over the app when they use it too.',
    example: '+92 300 1234567',
    seoTitle: 'Call Pakistan From the US Over Wi-Fi',
    seoDescription: 'Call Pakistan from your iPhone over Wi-Fi or data. Choose +92 in the country picker, check per-minute coin rates in the app, or call app users in Pakistan free.',
    tips: [
      'Pakistan is 9 to 10 hours ahead of US Eastern Time — an early-morning call from the US arrives in the Pakistani evening.',
      DIAL_TIP('Pakistan') + ' Mobile numbers start with 3 after +92 (for example +92 300…).',
      APP_TIP,
    ],
    faqs: [
      { q: 'How do I dial a Pakistani mobile?', a: 'Pick Pakistan (+92) in the country picker and enter the number without the leading 0 — 0300 1234567 becomes 300 1234567.' },
      { q: 'How much does it cost to call Pakistan?', a: 'Calls to regular numbers use coins. The current per-minute cost is shown in the app under “See per-minute charges”.' },
      { q: 'Can we talk for free?', a: 'Yes, if both of you use the app. App-to-app calls, video calls and chats don’t use coins.' },
    ],
  },
  {
    slug: 'nigeria', name: 'Nigeria', code: 'NG', flag: '🇳🇬', dial: '+234',
    title: 'Call Nigeria from the US',
    intro: 'Call mobiles in Nigeria over Wi-Fi or data from your second number — and talk free with anyone there who has the app.',
    example: '+234 803 123 4567',
    seoTitle: 'Call Nigeria From the US Over Wi-Fi',
    seoDescription: 'Call Nigerian mobiles from your iPhone over Wi-Fi or data. Pick +234, drop the leading 0, see coin rates in the app, or call app users in Nigeria for free.',
    tips: [
      'Nigeria is 5 to 6 hours ahead of US Eastern Time and doesn’t use daylight saving.',
      DIAL_TIP('Nigeria') + ' 0803 123 4567 is dialed as +234 803 123 4567.',
      APP_TIP,
    ],
    faqs: [
      { q: 'How do I dial a Nigerian mobile?', a: 'Choose Nigeria (+234) in the country picker and enter the number without its leading 0.' },
      { q: 'How much does it cost to call Nigeria?', a: 'Calls to regular numbers use coins. Check the current rate in the app under “See per-minute charges”.' },
      { q: 'Does it work on a weak connection?', a: 'Calls run over the internet, so a stable Wi-Fi or data connection on both ends gives the clearest audio.' },
    ],
  },
  {
    slug: 'bangladesh', name: 'Bangladesh', code: 'BD', flag: '🇧🇩', dial: '+880',
    title: 'Call Bangladesh from the US',
    intro: 'Reach family in Bangladesh over Wi-Fi or data from your second number, or call free when they use the app too.',
    example: '+880 1712 345678',
    seoTitle: 'Call Bangladesh From the US Over Wi-Fi',
    seoDescription: 'Call Bangladesh from your iPhone over Wi-Fi or data. Choose +880 in the country picker, see coin rates in the app, or call app users in Bangladesh for free.',
    tips: [
      'Bangladesh is 10 to 11 hours ahead of US Eastern Time and doesn’t use daylight saving.',
      DIAL_TIP('Bangladesh') + ' Mobile numbers start with 1 after +880 (for example +880 1712…).',
      APP_TIP,
    ],
    faqs: [
      { q: 'How do I dial a Bangladeshi mobile?', a: 'Pick Bangladesh (+880) in the country picker and enter the number without the leading 0 — 01712 345678 becomes 1712 345678.' },
      { q: 'How much does it cost to call Bangladesh?', a: 'Calls to regular numbers use coins, and the per-minute cost is listed in the app under “See per-minute charges”.' },
      { q: 'Can I send an SMS to Bangladesh?', a: 'Yes. SMS to regular numbers uses coins; the SMS rate for each country is on the same rates screen.' },
    ],
  },
  {
    slug: 'china', name: 'China', code: 'CN', flag: '🇨🇳', dial: '+86',
    title: 'Call China from the US',
    intro: 'Call mobiles and landlines in China over Wi-Fi or data from your second number.',
    example: '+86 139 1234 5678',
    seoTitle: 'Call China From the US Over Wi-Fi',
    seoDescription: 'Call mobiles and landlines in China from your iPhone over Wi-Fi or data. Pick +86 in the country picker and check the per-minute coin rate in the app first.',
    tips: [
      'China is 12 to 13 hours ahead of US Eastern Time and uses one time zone nationwide — evening in New York is the next morning in Beijing.',
      DIAL_TIP('China') + ' Chinese mobiles have 11 digits and start with 1.',
      'For landlines, drop the 0 from the area code — Beijing’s 010 becomes +86 10 followed by the local number.',
    ],
    faqs: [
      { q: 'How do I dial a Chinese mobile?', a: 'Choose China (+86) in the country picker and enter the 11-digit mobile number, which starts with 1.' },
      { q: 'How much does it cost to call China?', a: 'Calls to regular numbers use coins. The current per-minute cost is shown in the app under “See per-minute charges”.' },
      { q: 'Can I call landlines in China?', a: 'Yes. Enter the area code without its leading 0, then the local number.' },
    ],
  },
  {
    slug: 'vietnam', name: 'Vietnam', code: 'VN', flag: '🇻🇳', dial: '+84',
    title: 'Call Vietnam from the US',
    intro: 'Call family and friends in Vietnam over Wi-Fi or data from your second number — free when they’re on the app too.',
    example: '+84 91 234 5678',
    seoTitle: 'Call Vietnam From the US Over Wi-Fi',
    seoDescription: 'Call Vietnam from your iPhone over Wi-Fi or data. Pick +84 in the country picker, drop the leading 0, check coin rates in the app, or call app users free.',
    tips: [
      'Vietnam is 11 to 12 hours ahead of US Eastern Time and doesn’t use daylight saving.',
      DIAL_TIP('Vietnam') + ' 091 234 5678 is dialed as +84 91 234 5678.',
      APP_TIP,
    ],
    faqs: [
      { q: 'How do I dial a Vietnamese mobile?', a: 'Choose Vietnam (+84) in the country picker and enter the number without its leading 0.' },
      { q: 'How much does it cost to call Vietnam?', a: 'Calls to regular numbers use coins; see the current rate in the app under “See per-minute charges”.' },
      { q: 'Can I video call family in Vietnam?', a: 'Yes, if they use the app. Video calls between app users are free.' },
    ],
  },
  {
    slug: 'brazil', name: 'Brazil', code: 'BR', flag: '🇧🇷', dial: '+55',
    title: 'Call Brazil from the US',
    intro: 'Call mobiles and landlines across Brazil over Wi-Fi or data from your second number, or free over the app.',
    example: '+55 11 91234 5678',
    seoTitle: 'Call Brazil From the US Over Wi-Fi',
    seoDescription: 'Call Brazil from your iPhone over Wi-Fi or data. Pick +55, add the two-digit area code, check per-minute coin rates in the app, or call app users free.',
    tips: [
      'Most of Brazil (including São Paulo and Rio) is 1 to 2 hours ahead of US Eastern Time, depending on the season.',
      DIAL_TIP('Brazil') + ' Enter the two-digit area code (DDD), then the number — São Paulo mobiles look like 11 91234 5678.',
      APP_TIP,
    ],
    faqs: [
      { q: 'Do I need the carrier code to call Brazil?', a: 'No. Dialing internationally from the app you only need +55, the two-digit area code and the number.' },
      { q: 'How much does it cost to call Brazil?', a: 'Calls to regular numbers use coins. The per-minute cost is shown in the app under “See per-minute charges”.' },
      { q: 'Can I text Brazilian numbers?', a: 'Yes. SMS to regular numbers uses coins at the rate shown in the app for Brazil.' },
    ],
  },
  {
    slug: 'germany', name: 'Germany', code: 'DE', flag: '🇩🇪', dial: '+49',
    title: 'Call Germany from the US',
    intro: 'Call German mobiles and landlines over Wi-Fi or data from your second number, or free with anyone in Germany who uses the app.',
    example: '+49 151 23456789',
    seoTitle: 'Call Germany From the US Over Wi-Fi',
    seoDescription: 'Call Germany from your iPhone over Wi-Fi or data. Pick +49, drop the leading 0, see per-minute coin rates in the app, or call app users in Germany for free.',
    tips: [
      'Germany is 6 hours ahead of US Eastern Time for most of the year, and 5 hours for a few weeks around the daylight-saving changes.',
      DIAL_TIP('Germany') + ' German mobiles start with 15, 16 or 17 after +49.',
      APP_TIP,
    ],
    faqs: [
      { q: 'Do I keep the 0 in a German number?', a: 'No. A number written 0151 23456789 is dialed as +49 151 23456789.' },
      { q: 'How much does it cost to call Germany?', a: 'Calls to regular numbers use coins, and the per-minute cost is listed in the app under “See per-minute charges”.' },
      { q: 'Can I call German landlines?', a: 'Yes. Enter the city code without its leading 0, then the local number.' },
    ],
  },
  {
    slug: 'canada', name: 'Canada', code: 'CA', flag: '🇨🇦', dial: '+1',
    title: 'Call Canada from the US',
    intro: 'Canada shares the +1 country code with the US, so calling Canadian numbers from your second number works just like a call at home.',
    example: '+1 416 555 0147',
    seoTitle: 'Call Canada From the US Over Wi-Fi',
    seoDescription: 'Call and text Canadian numbers from your iPhone over Wi-Fi or data. Canada uses +1, so just enter the area code and number. Or get your own Canadian number.',
    tips: [
      'Canada spans six time zones, from Newfoundland (half an hour ahead of Atlantic Time) to the Pacific coast.',
      'Canada uses +1 like the US — in the Dial tab enter the 3-digit area code and 7-digit number.',
      'Calling Canadian contacts often? You can get a Canadian number of your own in the app, so they see a local number.',
    ],
    faqs: [
      { q: 'Is calling Canada an international call?', a: 'It uses the same +1 code as the US, so you dial it like a domestic number. Calls to regular numbers use coins; check the Canada rate in the app.' },
      { q: 'Can I get a Canadian number?', a: 'Yes. When you get a phone number in the app, switch the picker to CANADA and choose from the numbers available.' },
      { q: 'Can I text Canadian numbers?', a: 'Yes. SMS to regular numbers uses coins at the rate shown in the app.' },
    ],
  },
];

/** Exported for pages that want the shared tips (e.g. the international-calling hub). */
export const CALLING_TIPS = { appToApp: APP_TIP, rates: RATE_TIP };
