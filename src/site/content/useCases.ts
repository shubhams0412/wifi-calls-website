/* Use-case pages: /use-cases/{slug}. Describes only what the app really does — no prices,
   ratings or customer stories. Pro-only: group calls, broadcasts, voicemail, call forwarding,
   call recording, anonymous calling. */
import type { UseCase } from '../types';

export const USE_CASES: UseCase[] = [
  {
    slug: 'business',
    name: 'Small business',
    icon: 'card',
    short: 'A separate business line on the phone you already carry',
    title: 'A business phone number without a second phone',
    intro:
      'Give customers a dedicated US or Canadian number for your business, and keep your personal number for friends and family — all from the iPhone in your pocket.',
    seoTitle: 'Second Phone Number for Small Business',
    seoDescription:
      'Get a separate business line on your iPhone: a US or Canadian number for calls and texts, voicemail, recording and forwarding.',
    problems: [
      { icon: 'userCard', title: 'Your personal number is on every invoice', text: 'Once a customer has your personal number, they have it for good. A business number you can share freely keeps work and home apart.' },
      { icon: 'clock', title: 'Calls come in when you can’t answer', text: 'On a job, in a meeting or after hours, missed calls turn into missed work. Voicemail with your own greeting and call forwarding make sure every caller gets a response.' },
    ],
    features: ['second-phone-number', 'choose-your-number', 'voicemail', 'call-forwarding', 'call-recording'],
    sections: [
      {
        title: 'Look established from day one',
        text: 'Choose a number from the area codes on offer when you sign up, so your business line looks local to the people you serve. Calls and texts go out from that number, and your personal number never appears.',
        bullets: ['Calls and SMS from your business number', 'Pick from the numbers available in the US or Canada', 'Works over Wi-Fi or mobile data — no second SIM'],
      },
      {
        title: 'Stay on top of every customer',
        text: 'With Pro you can set a custom voicemail greeting, forward calls when you’re away, and automatically record outgoing calls so quotes and instructions are never lost. Broadcasts let you send one update to several customers at once, each receiving it as a private SMS.',
        bullets: ['Custom voicemail greeting (Pro)', 'Call forwarding and call recording (Pro)', 'Broadcast an SMS to a list of contacts (Pro)'],
      },
    ],
    faqs: [
      { q: 'Can my customers text my business number?', a: 'Yes. Your number receives and sends SMS, and you can reply from the iPhone app. Texts to regular phone numbers use coins from your balance.' },
      { q: 'Will customers see my personal number?', a: 'No. Calls and texts you make in the app go out from your second number, so your personal number stays private.' },
      { q: 'Which features need Pro?', a: 'Voicemail with a custom greeting, call forwarding, call recording, broadcasts, group calls and anonymous calling are part of the Pro plan. Lite covers the essentials: your number, calls, SMS and free app-to-app chat.' },
    ],
  },
  {
    slug: 'freelancers',
    name: 'Freelancers',
    icon: 'pencil',
    short: 'One number for clients, one for your life',
    title: 'A second number for freelance work',
    intro:
      'Put a dedicated client number on your website, proposals and profiles. When the project ends, your personal number stays yours — and your evenings stay quiet.',
    seoTitle: 'Second Phone Number for Freelancers',
    seoDescription:
      'Keep client calls and texts on a separate US or Canadian number. Get voicemail and call recording while your personal number stays private.',
    problems: [
      { icon: 'globe', title: 'Your number is on public profiles', text: 'Portfolio sites and marketplaces ask for a phone number. Listing a second number keeps your personal one out of search results and spam lists.' },
      { icon: 'moon', title: 'Clients call at all hours', text: 'When work and personal calls ring on the same number, it’s hard to switch off. A separate line lets you see at a glance who’s calling and when to answer.' },
      { icon: 'record', title: 'Details get lost on calls', text: 'Briefs and feedback often arrive by phone. Recording your outgoing calls (Pro) means you can listen back instead of relying on memory.' },
    ],
    features: ['second-phone-number', 'voicemail', 'call-recording', 'texting', 'block-numbers'],
    sections: [
      {
        title: 'Set boundaries without losing work',
        text: 'Let client calls go to voicemail outside your hours. With Pro, record your own greeting so clients know when you’re back, and listen to messages in the app when it suits you.',
        bullets: ['Custom voicemail greeting (Pro)', 'Voicemails listed by caller with playback', 'Block numbers that won’t take no for an answer'],
      },
      {
        title: 'Keep a clean record of client conversations',
        text: 'Call history, SMS threads and recordings live together in one app, separate from your personal messages.',
        bullets: ['SMS threads per client', 'Automatic recording of outgoing calls (Pro)', 'Same account on iPhone and web'],
      },
    ],
    faqs: [
      { q: 'Can I put this number on my website and invoices?', a: 'Yes. It’s a real US or Canadian phone number that can receive calls and SMS, so you can publish it anywhere you’d normally list a phone number.' },
      { q: 'Does call recording work on incoming calls?', a: 'Call recording in the app automatically records outgoing calls when it’s turned on. It’s part of the Pro plan.' },
      { q: 'What happens when I end a client relationship?', a: 'Nothing changes for your personal number. If a former client keeps contacting your second number, you can block them in Call Settings.' },
    ],
  },
  {
    slug: 'online-sellers',
    name: 'Online sellers',
    icon: 'tag',
    short: 'A number for buyers, listings and marketplaces',
    title: 'A separate number for selling online',
    intro:
      'Marketplace listings and buyer messages shouldn’t reach your personal phone. Use a second number for listings, pickups and buyer questions, and keep your own number to yourself.',
    seoTitle: 'Second Phone Number for Online Sellers',
    seoDescription:
      'List a second US or Canadian number on marketplaces and classifieds. Text buyers, arrange pickups and block time-wasters without sharing your personal number.',
    problems: [
      { icon: 'alert', title: 'Listings attract spam', text: 'A phone number in a public listing gets scraped. Use a second number for listings so the spam never reaches your personal line.' },
      { icon: 'message', title: 'Lots of short buyer conversations', text: 'Questions about size, price and pickup times come in by text. Each buyer gets their own SMS thread, separate from your personal chats.' },
      { icon: 'nosign', title: 'Some buyers won’t stop messaging', text: 'Block a number in seconds and that buyer can no longer call or text you.' },
    ],
    features: ['second-phone-number', 'texting', 'block-numbers', 'broadcast-messages', 'phone-calls'],
    sections: [
      {
        title: 'Handle buyers from your phone or your desk',
        text: 'Reply to buyers by SMS — including photos of the item — from the iPhone app. Calls and texts go out from your second number.',
        bullets: ['SMS and picture messages from your second number', 'Your personal number never appears'],
      },
      {
        title: 'Reach regular buyers in one go',
        text: 'Have a list of people who asked to hear about new stock? With Pro, a broadcast sends one message to several contacts, and each person receives it as their own private SMS.',
        bullets: ['Broadcast messages (Pro)', 'Recipients don’t see each other', 'Replies arrive in your normal SMS threads'],
      },
    ],
    faqs: [
      { q: 'Can I send photos to buyers?', a: 'Yes. You can attach a photo from your library or camera to an SMS conversation in the app.' },
      { q: 'How do I stop a buyer from contacting me?', a: 'Open Call Settings, go to Blocked numbers and add their number, or block them straight from the conversation. Blocked numbers can’t call or text you.' },
      { q: 'Do texts to buyers cost anything?', a: 'Texts and calls to regular phone numbers use coins from your balance. The in-app rates screen shows what each country costs.' },
    ],
  },
  {
    slug: 'dating',
    name: 'Dating & meeting people',
    icon: 'heartBolt',
    short: 'Share a number that isn’t your real one',
    title: 'A safer number for dating',
    intro:
      'Moving a conversation off a dating app usually means handing over your phone number. Share a second number instead, and decide later whether someone gets your real one.',
    seoTitle: 'Second Phone Number for Dating Safety',
    seoDescription:
      'Give matches a second phone number instead of your personal one. Call and text from a separate line, block anyone who makes you uneasy, and stay in control.',
    problems: [
      { icon: 'shield', title: 'Your number reveals more than you think', text: 'A personal number can be linked to your name and other accounts. A second number keeps those details private until you’re ready to share them.' },
      { icon: 'nosign', title: 'Not every match ends well', text: 'If a conversation turns uncomfortable, block the number and that person can no longer call or text you — your personal number was never involved.' },
      { icon: 'userQ', title: 'You don’t want to show a number at all', text: 'With anonymous calling (Pro), your number is hidden from the person you’re calling.' },
    ],
    features: ['second-phone-number', 'texting', 'block-numbers', 'anonymous-calling', 'phone-calls'],
    sections: [
      {
        title: 'Keep early conversations at a distance',
        text: 'Text and call matches from your second number while you get to know them. Everything stays in its own app, separate from your personal messages and call log.',
        bullets: ['Calls and SMS from your second number', 'Separate call history and message threads', 'Works on Wi-Fi or mobile data'],
      },
      {
        title: 'Step away whenever you want',
        text: 'Block a number from Call Settings and that person can no longer reach you. Turn on anonymous calling (Pro) when you’d rather not show any number.',
        bullets: ['Block numbers in seconds', 'Anonymous calling (Pro)', 'Your real number is never shared'],
      },
    ],
    faqs: [
      { q: 'Will my match know it’s a second number?', a: 'They’ll see a regular US or Canadian phone number. Calls and texts from the app look like normal calls and texts.' },
      { q: 'What happens when I block someone?', a: 'Blocked numbers can’t call or text your second number. You can unblock them later from Call Settings.' },
      { q: 'Can I hide my number completely?', a: 'Yes, with anonymous calling, which is part of the Pro plan. Turn it on in Call Settings to hide your number on outgoing calls.' },
    ],
  },
  {
    slug: 'travel',
    name: 'Travelers',
    icon: 'globe',
    short: 'Stay reachable abroad over Wi-Fi',
    title: 'Keep your US or Canadian number while you travel',
    intro:
      'Wherever you are, calls and texts work over Wi-Fi or mobile data. Stay reachable on your second number and talk to other app users for free, without roaming on your carrier.',
    seoTitle: 'Stay Reachable Abroad With a Second Number',
    seoDescription:
      'Make and receive calls and texts over Wi-Fi while you travel. Keep a US or Canadian number, call home with coins and talk free to other app users from anywhere.',
    problems: [
      { icon: 'wifi', title: 'Roaming is expensive', text: 'The app runs over any internet connection. Join hotel or café Wi-Fi, or use local data, and call or text through the app instead of your carrier.' },
      { icon: 'phone', title: 'People at home need to reach you', text: 'Your second number keeps working while you’re away, so family, colleagues and services back home can still call and text it.' },
      { icon: 'users', title: 'Your travel group is spread out', text: 'Calls, video calls and chats between app users are free, so the group can stay in touch wherever each person is.' },
    ],
    features: ['second-phone-number', 'free-app-calls', 'video-calls', 'group-chat', 'phone-calls', 'call-forwarding'],
    sections: [
      {
        title: 'Calls home without the carrier',
        text: 'Calling a regular phone number uses coins from your balance; the rates screen in the app shows the cost by country before you dial. Calls to other app users don’t use coins at all.',
        bullets: ['Over Wi-Fi or mobile data', 'Coins for calls and SMS to regular numbers', 'Free app-to-app calls and chat'],
      },
      {
        title: 'Never miss what matters',
        text: 'With Pro, voicemail with your own greeting takes messages while you’re in the air, and call forwarding can send calls to another number when you can’t use the app.',
        bullets: ['Voicemail with custom greeting (Pro)', 'Call forwarding (Pro)', 'Notifications for incoming calls and messages'],
      },
    ],
    faqs: [
      { q: 'Does it work outside the US and Canada?', a: 'The app works anywhere you have an internet connection. Your number is a US or Canadian number, and you can call other countries using coins.' },
      { q: 'Do I need a local SIM?', a: 'No. Wi-Fi is enough. If you prefer mobile data, any data connection works, including a local data SIM.' },
      { q: 'How much do international calls cost?', a: 'Calls to regular numbers use coins, and the cost depends on the country. Open Purchase Coins in the app and tap “See per-minute charges” to check before you call.' },
    ],
  },
  {
    slug: 'privacy',
    name: 'Online privacy',
    icon: 'lock',
    short: 'Sign-ups and forms without your real number',
    title: 'Protect your real phone number online',
    intro:
      'Loyalty programs, delivery apps and sign-up forms all want a phone number. Give them your second number and keep your real one for the people you actually know.',
    seoTitle: 'Keep Your Real Phone Number Private Online',
    seoDescription:
      'Use a second US or Canadian number for sign-ups, deliveries and forms so your real number stays private. Block unwanted callers and hide caller ID when needed.',
    problems: [
      { icon: 'mail', title: 'Every form asks for a number', text: 'Use your second number for shops, deliveries and newsletters. If it ends up on a marketing list, your personal number isn’t on it.' },
      { icon: 'nosign', title: 'Unwanted calls and texts', text: 'Block any number that keeps contacting your second line. Blocked numbers can’t call or text you.' },
      { icon: 'userQ', title: 'Calls where you’d rather not show a number', text: 'Anonymous calling (Pro) hides your number from the person you’re calling.' },
    ],
    features: ['second-phone-number', 'block-numbers', 'anonymous-calling', 'texting', 'choose-your-number'],
    sections: [
      {
        title: 'A buffer between you and the internet',
        text: 'Your second number receives calls and SMS like any other phone number, so you can use it for sign-ups, deliveries and listings. Your personal number never leaves your hands.',
        bullets: ['Receive SMS and calls on your second number', 'Keep your personal number off public lists', 'Choose a number from the US or Canada'],
      },
      {
        title: 'Your contacts stay private too',
        text: 'If you let the app check which of your contacts already use it, names and numbers are used only to find matches and are not kept, shared or sold. You can say no and still use every other feature.',
        bullets: ['Contact matching is optional', 'Contacts are never sold', 'Change permissions any time in your settings'],
      },
    ],
    faqs: [
      { q: 'Can I receive verification codes on my second number?', a: 'Your number receives SMS, so many services can send codes to it. Some services don’t accept internet-based numbers for verification, so check with the service if a code doesn’t arrive.' },
      { q: 'Does the app sell my data or contacts?', a: 'No. Contact matching is optional and only used to show which contacts already use the app; the contacts are not kept, shared or sold.' },
      { q: 'How do I block a number?', a: 'Go to Settings → Call Settings → Blocked numbers, enter the number or pick a contact, and tap Block this number.' },
    ],
  },
];
