/* Feature pages (/features/{slug}). Copy describes only what the app actually does. */
import type { Feature } from '../types';

export const FEATURES: Feature[] = [
  /* ---------------- Your number ---------------- */
  {
    slug: 'second-phone-number',
    group: 'numbers',
    name: 'Second phone number',
    icon: 'phonePlus',
    short: 'A real US or Canadian number on the phone you already have',
    title: 'A second phone number, without a second phone',
    intro: 'Get a real US or Canadian number that lives in the app. Call and text from it, and keep your personal number to yourself.',
    highlights: [
      { icon: 'iphone', title: 'No second SIM', text: 'Your new number runs over Wi-Fi or mobile data on the iPhone you already own.' },
      { icon: 'shieldCheck', title: 'Keep your real number private', text: 'Share the second number for listings, sign-ups and work, and keep your personal line for people you trust.' },
      { icon: 'message', title: 'Calls and texts', text: 'Call and send SMS to regular phone numbers from your second number, right inside the app.' },
      { icon: 'desktop', title: 'Phone and web', text: 'Use the same number and conversations in the app and in your browser.' },
    ],
    steps: [
      'Download Wi-Fi Calling & Texting from the App Store and sign in with your phone number.',
      'Tap "Get a phone number" on the Dial screen or in Settings.',
      'Choose USA or Canada, pick a number from the list, and it\'s yours in seconds.',
    ],
    sections: [
      {
        title: 'One phone, two numbers',
        text: 'Your second number shows up across the app: on the Dial screen, in Messages and in Settings. Calls and texts you make from the app use this number, so the people you contact see it instead of your personal one.',
        bullets: ['Separate calls and texts for work, selling or dating', 'No contract and no extra SIM card', 'Works anywhere you have Wi-Fi or data'],
      },
      {
        title: 'Calls between app users are free',
        text: 'When the person you\'re contacting also uses Wi-Fi Calling & Texting, calls and chats between you are free. Calls and texts to regular phone numbers use coins, which you can top up anytime in Settings → Purchase Coins.',
      },
    ],
    faqs: [
      { q: 'Which countries can I get a number in?', a: 'You can choose a number from the United States or Canada when you get your number in the app.' },
      { q: 'Do I need a subscription?', a: 'Yes. Getting a second number requires an active Lite or Pro subscription, which you can start from the plans screen in the app.' },
      { q: 'Will people see my personal number?', a: 'No. Calls and texts you make from the app go out from your second number, so your personal number stays private.' },
      { q: 'Does it work without mobile signal?', a: 'Yes. The app works over Wi-Fi as well as mobile data, so you can call and text wherever you have an internet connection.' },
    ],
    related: ['choose-your-number', 'texting', 'phone-calls'],
    seoTitle: 'Second Phone Number for iPhone | Wi-Fi Calling & Texting',
    seoDescription: 'Get a real US or Canadian second phone number on the iPhone you already have. Call and text from it over Wi-Fi or data and keep your personal number private.',
  },
  {
    slug: 'choose-your-number',
    group: 'numbers',
    name: 'Choose your number',
    icon: 'pin',
    short: 'Pick a US or Canadian number by city before you claim it',
    title: 'Pick the number that fits you',
    intro: 'Browse available US and Canadian numbers, see the city each one belongs to, and claim the one you like.',
    highlights: [
      { icon: 'globe', title: 'USA or Canada', text: 'Switch between the two countries to see the numbers available in each.' },
      { icon: 'pin', title: 'See the city', text: 'Every number shows its city and region, so you can choose a local-looking number.' },
      { icon: 'checkCircle', title: 'Voice and SMS ready', text: 'Numbers in the list support both calls and text messages.' },
    ],
    steps: [
      'Tap "Get a phone number" on the Dial screen or in Settings.',
      'Choose USA or Canada to see the numbers available right now.',
      'Tap the number you want. Once it\'s added, it appears on your Dial screen.',
    ],
    sections: [
      {
        title: 'A local presence where it matters',
        text: 'If your customers, landlord or clients are in one city, a number from that area feels familiar when it shows up on their phone. Pick the city that suits you from the list of available numbers.',
      },
      {
        title: 'Your number, shown everywhere you need it',
        text: 'Once it\'s claimed, your number appears on the Dial screen, at the top of Settings and in your profile, so it\'s always easy to copy and share.',
        bullets: ['Shown as a green badge on the Dial screen', 'Listed under "Your number" in Settings', 'Used for every call and SMS you send from the app'],
      },
    ],
    faqs: [
      { q: 'Can I search for a specific number?', a: 'The app shows a list of numbers available in the country you choose, with the city for each one. Pick any number from that list.' },
      { q: 'What if I don\'t see a number I like?', a: 'Availability changes, so try the other country or check back a little later for new numbers.' },
      { q: 'Do I need a plan to claim a number?', a: 'Yes. An active Lite or Pro subscription is needed to claim a number.' },
    ],
    related: ['second-phone-number', 'phone-calls', 'texting'],
    seoTitle: 'Choose Your Own US or Canada Number | Wi-Fi Calling',
    seoDescription: 'Browse available US and Canadian phone numbers by city, pick the one you like and start calling and texting from it on your iPhone or in your web browser today.',
  },
  {
    slug: 'web-app',
    group: 'numbers',
    name: 'Web app',
    icon: 'desktop',
    short: 'Call, text and chat from your browser with the same account',
    title: 'Your number, in your browser',
    intro: 'Use Wi-Fi Calling & Texting on your computer. Your number, messages, calls and contacts are there when you sign in on the web.',
    highlights: [
      { icon: 'desktop', title: 'Big-screen messaging', text: 'Read and reply to SMS and chats with a full keyboard, conversation list on the left and thread on the right.' },
      { icon: 'keypad', title: 'Type to dial', text: 'Type or paste a number on the dial pad straight from your keyboard.' },
      { icon: 'devices', title: 'Same account everywhere', text: 'Sign in with the same phone number you use in the iPhone app.' },
      { icon: 'moon', title: 'Light and dark', text: 'Switch between light and dark mode from the sidebar.' },
    ],
    steps: [
      'Open the web app from the website and sign in with your phone number.',
      'Enter the 6-digit code we send you to verify it\'s you.',
      'Use the sidebar to move between Calls, Messages, Dial, Contacts and Settings.',
    ],
    sections: [
      {
        title: 'Built for the desktop',
        text: 'The web app follows the iPhone app\'s design, laid out for a larger screen: lists and conversations side by side, so you can move through your messages quickly without losing your place.',
      },
      {
        title: 'Manage your devices',
        text: 'See every device signed in to your account under Settings → Account Settings → My Devices, and sign out of the others from there if you need to.',
      },
    ],
    faqs: [
      { q: 'Do I need to install anything?', a: 'No. The web app runs in your browser — open it from the website and sign in.' },
      { q: 'Is it the same account as the iPhone app?', a: 'Yes. Sign in with the same phone number and you\'ll use the same account.' },
      { q: 'Can I see which devices are signed in?', a: 'Yes. Go to Settings → Account Settings → My Devices to see them and sign out other devices.' },
    ],
    related: ['second-phone-number', 'texting', 'group-chat'],
    seoTitle: 'Call & Text From Your Browser | Wi-Fi Calling Web App',
    seoDescription: 'Use your second number on your computer. The Wi-Fi Calling & Texting web app brings your calls, SMS, chats and contacts to the browser with nothing to install.',
  },

  /* ---------------- Calls ---------------- */
  {
    slug: 'free-app-calls',
    group: 'calls',
    name: 'Free app-to-app calls',
    icon: 'wifi',
    short: 'Free voice calls to friends who also use the app',
    title: 'Free calls to friends on the app',
    intro: 'When your friends use Wi-Fi Calling & Texting too, calling them is free. No coins, no minutes — just Wi-Fi or data.',
    highlights: [
      { icon: 'wifi', title: 'Over Wi-Fi or data', text: 'Calls go over the internet, so they work wherever you have a connection.' },
      { icon: 'users', title: 'Friends found for you', text: 'The Contacts tab shows which of your contacts already use the app.' },
      { icon: 'checkCircle', title: 'No coins used', text: 'App-to-app calls never use your coin balance.' },
    ],
    steps: [
      'Open Contacts and choose the Friends tab to see contacts already on the app.',
      'Tap the green phone button next to a friend.',
      'Talk for free. Use Mute and Speaker on the call screen, then tap End call.',
    ],
    sections: [
      {
        title: 'Find who\'s already here',
        text: 'Allow contacts access and the app matches your contacts against its users, so friends appear in one list. Your contacts are only used for that match — they aren\'t kept, shared or sold.',
      },
      {
        title: 'Call from wherever you are',
        text: 'Start a free call from the Friends list, from the App Calls tab on the Dial screen, or from a chat thread. Every call appears in your Recents so you can call back with one tap.',
        bullets: ['Friends list in Contacts', 'App Calls on the Dial screen', 'Phone button inside a chat'],
      },
    ],
    faqs: [
      { q: 'Are app-to-app calls really free?', a: 'Yes. Calls between Wi-Fi Calling & Texting users don\'t use coins. You only need a Wi-Fi or mobile data connection.' },
      { q: 'What if my friend isn\'t on the app?', a: 'You can still call their regular phone number using coins, or invite them from the app so you can call each other for free.' },
      { q: 'Do I need to give contacts access?', a: 'Only if you want the app to show which contacts are already users. You can turn it off anytime in your device settings.' },
    ],
    related: ['video-calls', 'group-calls', 'group-chat'],
    seoTitle: 'Free App-to-App Calls Over Wi-Fi | Wi-Fi Calling & Texting',
    seoDescription: 'Call friends who use Wi-Fi Calling & Texting for free over Wi-Fi or mobile data. No coins or minutes used — find friends in Contacts and tap call to talk.',
  },
  {
    slug: 'video-calls',
    group: 'calls',
    name: 'Video calls',
    icon: 'video',
    short: 'Face-to-face video calls with friends on the app',
    title: 'See each other with free video calls',
    intro: 'Start a one-to-one video call with any friend who uses Wi-Fi Calling & Texting — free, over Wi-Fi or data.',
    highlights: [
      { icon: 'video', title: 'One tap from Contacts', text: 'Tap the video button next to a friend to start a call.' },
      { icon: 'flipCamera', title: 'Flip the camera', text: 'Switch between front and back cameras during the call.' },
      { icon: 'micOff', title: 'Quick controls', text: 'Mute your mic or turn your camera off without leaving the call.' },
    ],
    steps: [
      'Open Contacts → Friends, or the App Calls tab on the Dial screen.',
      'Tap the video button next to the friend you want to see.',
      'Use the controls to mute, turn the camera off, flip cameras or hang up.',
    ],
    sections: [
      {
        title: 'Your view, where you want it',
        text: 'Your own video sits in a small window you can drag to any corner, so it never covers the person you\'re talking to.',
      },
      {
        title: 'Free between app users',
        text: 'Video calls are between people who both use the app, so they don\'t use coins. All you need is a Wi-Fi or mobile data connection.',
      },
    ],
    faqs: [
      { q: 'Do video calls cost coins?', a: 'No. Video calls are between app users and don\'t use coins.' },
      { q: 'Can I video call a regular phone number?', a: 'No. Video calls are for friends who use Wi-Fi Calling & Texting. You can make a regular voice call to any number using coins.' },
      { q: 'Can I turn off my camera during a call?', a: 'Yes. Tap the camera button to turn your video off and on again at any time.' },
    ],
    related: ['free-app-calls', 'group-calls', 'group-chat'],
    seoTitle: 'Free Video Calls With Friends | Wi-Fi Calling & Texting',
    seoDescription: 'Make free one-to-one video calls to friends who use Wi-Fi Calling & Texting. Flip cameras, mute and move your preview window — all over Wi-Fi or mobile data.',
  },
  {
    slug: 'group-calls',
    group: 'calls',
    name: 'Group calls',
    icon: 'group',
    short: 'Call a whole group of friends at once',
    title: 'Call the whole group at once',
    intro: 'Bring several friends into one voice call. Group calls are included with Pro.',
    pro: true,
    highlights: [
      { icon: 'group', title: 'Call a group in one tap', text: 'Start a call from any group chat with the Call Group button.' },
      { icon: 'users', title: 'See who joined', text: 'The call screen shows each member as ringing, connected or not answering.' },
      { icon: 'crown', title: 'Included with Pro', text: 'Group calls come with the Pro plan, along with recording, voicemail and more.' },
    ],
    steps: [
      'Open Messages → Chat and tap the groups button to see your groups.',
      'Open a group and tap the phone button, or tap Call Group on the group\'s info page.',
      'Everyone in the group is called; talk together and tap End call when you\'re done.',
    ],
    sections: [
      {
        title: 'Built on your group chats',
        text: 'Create a group, add friends who use the app, and you can chat and call the same people from one place. Admins can rename the group and add or remove members.',
      },
      {
        title: 'Know who\'s on the line',
        text: 'Each member shows their status during the call, so you can tell at a glance who has joined and who hasn\'t picked up yet.',
      },
    ],
    faqs: [
      { q: 'Do I need Pro for group calls?', a: 'Yes. Group calls are included with the Pro plan.' },
      { q: 'Who can I add to a group?', a: 'Friends who use Wi-Fi Calling & Texting. Invite others from the app so they can join.' },
      { q: 'Do group calls use coins?', a: 'No. Group calls are between app users and don\'t use coins.' },
    ],
    related: ['group-chat', 'free-app-calls', 'video-calls'],
    seoTitle: 'Group Voice Calls With Friends | Wi-Fi Calling & Texting',
    seoDescription: 'Call a whole group of friends at once with Wi-Fi Calling & Texting Pro. Start a group call from any group chat and see who has joined, all over Wi-Fi or data.',
  },
  {
    slug: 'phone-calls',
    group: 'calls',
    name: 'Calls to any number',
    icon: 'phone',
    short: 'Call regular numbers in the US and abroad from your second number',
    title: 'Call any phone number over Wi-Fi',
    intro: 'Dial regular landlines and mobiles from your second number. Calls go over Wi-Fi or data and use coins from your balance.',
    highlights: [
      { icon: 'keypad', title: 'Familiar dial pad', text: 'Pick the country code, dial the number and tap call — just like your phone app.' },
      { icon: 'globe', title: 'Call abroad too', text: 'Choose from a long list of countries on the dial pad\'s country picker.' },
      { icon: 'dollar', title: 'Pay with coins', text: 'Calls to regular numbers use coins. Top up anytime and check rates by country in the app.' },
      { icon: 'book', title: 'Dial from your phonebook', text: 'Tap the phonebook button to fill in a contact\'s number.' },
    ],
    steps: [
      'Open the Dial screen and make sure "Phone Calls" is selected.',
      'Pick the country, then type the number or choose a contact from your phonebook.',
      'Tap the call button. Your call goes out from your second number.',
    ],
    sections: [
      {
        title: 'How coins work',
        text: 'Coins pay for calls and texts to regular phone numbers. For US numbers it\'s roughly one coin per minute. See the coin cost for every country in Settings → Purchase Coins → Add coins → See per-minute charges.',
        bullets: ['Check your balance in Settings → Purchase Coins', 'Top up whenever you need to — no subscription for coins', 'App-to-app calls never use coins'],
      },
      {
        title: 'Everything in one call history',
        text: 'Outgoing, incoming and missed calls appear in Calls → Recents. Tap a call to call back, or tap the info button to see the contact.',
      },
    ],
    faqs: [
      { q: 'What do I need to call regular numbers?', a: 'An active subscription, your own second number from the app, and coins in your balance.' },
      { q: 'How much does a call cost?', a: 'Calls use coins. US calls are roughly one coin per minute, and you can see the coin cost for each country in the app\'s rates list.' },
      { q: 'Can I call international numbers?', a: 'Yes. Choose the country on the dial pad. The rates list in the app shows the coin cost for each country.' },
    ],
    related: ['second-phone-number', 'call-recording', 'anonymous-calling'],
    seoTitle: 'Call Any Phone Number Over Wi-Fi | Wi-Fi Calling & Texting',
    seoDescription: 'Call regular landlines and mobiles in the US and abroad from your second number over Wi-Fi or data. Calls use coins, and app-to-app calls with friends are free.',
  },

  /* ---------------- Messaging ---------------- */
  {
    slug: 'texting',
    group: 'messaging',
    name: 'Texting & picture messages',
    icon: 'message',
    short: 'Send SMS and photos to any number from your second number',
    title: 'Text anyone from your second number',
    intro: 'Send SMS and photos to any phone number. Replies come back to your second number, right in the Messages tab.',
    highlights: [
      { icon: 'message', title: 'Real SMS', text: 'Text people on any phone — they don\'t need the app.' },
      { icon: 'image', title: 'Send photos', text: 'Attach a picture from your library to any conversation.' },
      { icon: 'signature', title: 'Message signature', text: 'Add an optional signature such as your name or number to your texts.' },
      { icon: 'nosign', title: 'Block unwanted texts', text: 'Block a number from the conversation menu with one tap.' },
    ],
    steps: [
      'Open Messages and choose the SMS tab.',
      'Tap the pencil button, enter a number or pick a contact.',
      'Type your message or attach a photo, then send.',
    ],
    sections: [
      {
        title: 'All your conversations in one place',
        text: 'Every SMS thread lives in Messages → SMS, with unread counts, search and day separators. Tap a thread to reply, call the person back or open their contact info.',
      },
      {
        title: 'Make it yours',
        text: 'Choose a font size and an optional message signature in Settings → Chat Settings. Texts to regular numbers use coins; chats with friends on the app are free.',
      },
    ],
    faqs: [
      { q: 'Can I text people who don\'t have the app?', a: 'Yes. SMS goes to any regular phone number from your second number.' },
      { q: 'Do texts cost coins?', a: 'Texts to regular phone numbers use coins — about one coin per message for US numbers. Chats with app users are free.' },
      { q: 'Can I send pictures?', a: 'Yes. Tap the photo button in any conversation to send a picture.' },
    ],
    related: ['broadcast-messages', 'group-chat', 'block-numbers'],
    seoTitle: 'Text From a Second Number | SMS & Picture Messages',
    seoDescription: 'Send SMS and picture messages to any phone number from your second number. Replies arrive in the app, so your personal number stays private. Works over Wi-Fi.',
  },
  {
    slug: 'group-chat',
    group: 'messaging',
    name: 'Chat & groups',
    icon: 'messages',
    short: 'Free one-to-one and group chats with friends on the app',
    title: 'Free chats and group chats',
    intro: 'Chat with friends who use Wi-Fi Calling & Texting, one-to-one or in groups. Messages and photos between app users are free.',
    highlights: [
      { icon: 'messages', title: 'One-to-one chat', text: 'Start a chat with any friend on the app from Messages → Chat.' },
      { icon: 'group', title: 'Groups', text: 'Create a group with a name and add friends — great for family, teams or trips.' },
      { icon: 'image', title: 'Share photos', text: 'Send pictures in any chat or group.' },
      { icon: 'palette', title: 'Chat wallpaper', text: 'Pick a background for your chat threads in Chat Settings.' },
    ],
    steps: [
      'Open Messages and switch to the Chat tab.',
      'Tap the pencil button to pick a friend, or the groups button to create a group.',
      'Name your group, add members and start chatting.',
    ],
    sections: [
      {
        title: 'Groups you can manage',
        text: 'Group admins can rename the group, add members from their friends list and remove people. Anyone can leave a group from its info page.',
      },
      {
        title: 'From chat to call in one tap',
        text: 'Every chat has call and video buttons, so you can switch from typing to talking without leaving the conversation.',
      },
    ],
    faqs: [
      { q: 'Are chats free?', a: 'Yes. Chats and photos between Wi-Fi Calling & Texting users don\'t use coins.' },
      { q: 'Who can I chat with?', a: 'Friends who use the app. They appear in Contacts → Friends.' },
      { q: 'Do I need Pro to create a group?', a: 'Creating groups is part of the Pro plan in the app.' },
    ],
    related: ['group-calls', 'free-app-calls', 'texting'],
    seoTitle: 'Free Chat & Group Chat With Friends | Wi-Fi Calling',
    seoDescription: 'Chat for free with friends who use Wi-Fi Calling & Texting. Create groups, share photos, pick a chat wallpaper and jump from chat to a call with a single tap.',
  },
  {
    slug: 'broadcast-messages',
    group: 'messaging',
    name: 'Broadcast messages',
    icon: 'megaphone',
    short: 'Send one SMS to many people — each gets it privately',
    title: 'One message, many people',
    intro: 'Write a message once and send it to a list of contacts. Each person receives a private SMS from your second number. Included with Pro.',
    pro: true,
    highlights: [
      { icon: 'megaphone', title: 'Write once', text: 'Pick recipients from your phonebook and type your message one time.' },
      { icon: 'lock', title: 'Private for everyone', text: 'Each recipient gets their own SMS — nobody sees the rest of the list.' },
      { icon: 'history', title: 'Keep a record', text: 'Past broadcasts are saved so you can see what you sent and send a follow-up.' },
    ],
    steps: [
      'Open Messages → SMS and tap the megaphone button.',
      'Tap the pencil button, then Add to choose recipients from your contacts.',
      'Type your message and tap Send broadcast.',
    ],
    sections: [
      {
        title: 'Made for updates and reminders',
        text: 'Let tenants know about maintenance, remind clients about appointments, or share an open-house time with everyone at once — without creating a group text where replies go to all.',
      },
      {
        title: 'How it\'s charged',
        text: 'Broadcasts are sent as individual SMS from your second number, so each message uses coins like a normal text.',
      },
    ],
    faqs: [
      { q: 'Can recipients see each other?', a: 'No. Every person receives a separate, private SMS.' },
      { q: 'Do I need Pro?', a: 'Yes. Broadcast messages are included with the Pro plan, and you need your own second number.' },
      { q: 'Do broadcasts use coins?', a: 'Yes. Each recipient gets a normal SMS, which uses coins like any other text.' },
    ],
    related: ['texting', 'group-chat', 'second-phone-number'],
    seoTitle: 'Broadcast SMS to Many Contacts | Wi-Fi Calling & Texting',
    seoDescription: 'Send one message to many people with broadcast messages in Wi-Fi Calling & Texting Pro. Every recipient gets their own private SMS from your second number.',
  },

  /* ---------------- Answering for you ---------------- */
  {
    slug: 'voicemail',
    group: 'answering',
    name: 'Voicemail',
    icon: 'mic',
    short: 'Your own greeting and missed-call messages in the app',
    title: 'Voicemail with your own greeting',
    intro: 'Never miss a message on your second number. Record a greeting in your own voice and play messages right in the app. Included with Pro.',
    pro: true,
    highlights: [
      { icon: 'mic', title: 'Record your greeting', text: 'Use the standard greeting or record a custom one in your own voice.' },
      { icon: 'play', title: 'Play in the app', text: 'Listen to messages in Calls → Voicemail, grouped by caller.' },
      { icon: 'phone', title: 'Call back fast', text: 'Return the call straight from the voicemail screen.' },
    ],
    steps: [
      'Open Settings → Call Settings → Voicemail and turn on "Use voicemail".',
      'Choose "Default greeting" or "Your own greeting" and record up to 60 seconds.',
      'Find new messages in Calls → Voicemail and tap to play.',
    ],
    sections: [
      {
        title: 'A greeting that sounds like you',
        text: 'Record your greeting in the app, listen back, and save it — or discard it and try again. Switch back to the default greeting whenever you like.',
      },
      {
        title: 'Organized by caller',
        text: 'Voicemails are grouped by the person who called, so you can see every message from someone in one place and delete what you don\'t need.',
      },
    ],
    faqs: [
      { q: 'Do I need Pro for voicemail?', a: 'Yes. Voicemail with a custom greeting is included with the Pro plan.' },
      { q: 'How long can my greeting be?', a: 'You can record a greeting of up to 60 seconds.' },
      { q: 'Where do I find my messages?', a: 'Open the Calls tab and switch to Voicemail.' },
    ],
    related: ['call-forwarding', 'call-recording', 'second-phone-number'],
    seoTitle: 'Voicemail With a Custom Greeting | Wi-Fi Calling & Texting',
    seoDescription: 'Get voicemail on your second number with Wi-Fi Calling & Texting Pro. Record a greeting in your own voice, play messages by caller and call back in one tap.',
  },
  {
    slug: 'call-forwarding',
    group: 'answering',
    name: 'Call forwarding',
    icon: 'phoneOut',
    short: 'Send calls on your second number to another phone',
    title: 'Forward calls to any phone',
    intro: 'Have calls to your second number ring through to another phone number when you need them to. Included with Pro.',
    pro: true,
    highlights: [
      { icon: 'phoneOut', title: 'Forward to any number', text: 'Choose the country and enter the number calls should go to.' },
      { icon: 'clock', title: 'On when you need it', text: 'Turn forwarding on for busy days and off again when you\'re back in the app.' },
      { icon: 'crown', title: 'Included with Pro', text: 'Call forwarding comes with the Pro plan.' },
    ],
    steps: [
      'Open the call forwarding setting in the app.',
      'Turn on Call Forwarding, choose the country and enter the number to forward to.',
      'Tap Save. Calls to your second number now ring that phone.',
    ],
    sections: [
      {
        title: 'Stay reachable on the go',
        text: 'If you\'re somewhere you\'d rather take calls on another line, forwarding sends callers to that number so they still reach you.',
      },
      {
        title: 'Your second number stays the front door',
        text: 'People keep calling the same second number. You decide where those calls ring.',
      },
    ],
    faqs: [
      { q: 'Do I need Pro?', a: 'Yes. Call forwarding is included with the Pro plan.' },
      { q: 'Can I forward to a number in another country?', a: 'Yes. Choose the country before entering the number.' },
      { q: 'Can I turn it off later?', a: 'Yes. Switch Call Forwarding off and calls will come to the app again.' },
    ],
    related: ['voicemail', 'call-recording', 'second-phone-number'],
    seoTitle: 'Forward Calls From Your Second Number | Wi-Fi Calling',
    seoDescription: 'Forward calls from your second number to another phone with Wi-Fi Calling & Texting Pro. Choose the country, enter a number and switch it on or off anytime.',
  },
  {
    slug: 'call-recording',
    group: 'answering',
    name: 'Call recording',
    icon: 'record',
    short: 'Automatically record outgoing calls and play them back',
    title: 'Record your calls automatically',
    intro: 'Turn on call recording once and every outgoing call is saved. Play recordings back whenever you need them. Included with Pro.',
    pro: true,
    highlights: [
      { icon: 'record', title: 'Set it once', text: 'One switch in Call Settings records every outgoing call.' },
      { icon: 'play', title: 'Play anytime', text: 'Find recordings in Settings → My Recordings and play them with a scrub bar.' },
      { icon: 'trash', title: 'Delete what you don\'t need', text: 'Remove any recording with one tap.' },
    ],
    steps: [
      'Open Settings → Call Settings and turn on "Call recording".',
      'Make your call as usual from the Dial screen.',
      'Open Settings → My Recordings to play, scrub through or delete recordings.',
    ],
    sections: [
      {
        title: 'Never lose the details',
        text: 'Addresses, prices, appointment times — go back to the recording instead of trying to remember. Each recording shows who you called, when, and how long the call lasted.',
      },
      {
        title: 'Know when you\'re recording',
        text: 'A red dot on the call screen shows that the call is being recorded. Please make sure you follow the recording laws where you and the other person are.',
      },
    ],
    faqs: [
      { q: 'Which calls are recorded?', a: 'When call recording is on, outgoing calls are recorded automatically.' },
      { q: 'Where are recordings saved?', a: 'In Settings → My Recordings, where you can play, scrub through and delete them.' },
      { q: 'Do I need Pro?', a: 'Yes. Call recording is included with the Pro plan.' },
    ],
    related: ['phone-calls', 'voicemail', 'anonymous-calling'],
    seoTitle: 'Automatic Call Recording on iPhone | Wi-Fi Calling',
    seoDescription: 'Record outgoing calls automatically with Wi-Fi Calling & Texting Pro. Turn it on once, then play back, scrub through or delete recordings anytime in the app.',
  },

  /* ---------------- Privacy & control ---------------- */
  {
    slug: 'anonymous-calling',
    group: 'privacy',
    name: 'Anonymous calling',
    icon: 'userQ',
    short: 'Hide your number from the person you\'re calling',
    title: 'Call without showing your number',
    intro: 'Turn on anonymous calling and the people you call won\'t see your number. Included with Pro.',
    pro: true,
    highlights: [
      { icon: 'userQ', title: 'Hide your caller ID', text: 'Your number isn\'t shown to the person you call.' },
      { icon: 'sliders', title: 'One switch', text: 'Turn it on or off anytime in Call Settings.' },
      { icon: 'crown', title: 'Included with Pro', text: 'Anonymous calling comes with the Pro plan.' },
    ],
    steps: [
      'Open Settings → Call Settings.',
      'Turn on "Anonymous call" under Privacy.',
      'Make your call from the Dial screen as usual — your number stays hidden.',
    ],
    sections: [
      {
        title: 'Privacy when you want it',
        text: 'Calling a seller, a service or someone you\'ve just met? Hide your number for those calls, then turn the switch off when you want people to recognize you.',
      },
      {
        title: 'Two layers of privacy',
        text: 'Your personal number is already kept private by your second number. Anonymous calling goes one step further and hides the second number too.',
      },
    ],
    faqs: [
      { q: 'Who sees my number when it\'s on?', a: 'The person you call won\'t see your number.' },
      { q: 'Do I need Pro?', a: 'Yes. Anonymous calling is included with the Pro plan.' },
      { q: 'Can I switch it off?', a: 'Yes. Turn off "Anonymous call" in Settings → Call Settings at any time.' },
    ],
    related: ['block-numbers', 'second-phone-number', 'phone-calls'],
    seoTitle: 'Anonymous Calling: Hide Your Number | Wi-Fi Calling',
    seoDescription: 'Hide your caller ID with anonymous calling in Wi-Fi Calling & Texting Pro. Turn it on in Call Settings and the people you call won\'t see your number at all.',
  },
  {
    slug: 'block-numbers',
    group: 'privacy',
    name: 'Block numbers',
    icon: 'nosign',
    short: 'Stop calls and texts from people you don\'t want to hear from',
    title: 'Block calls and texts you don\'t want',
    intro: 'Block any number or contact. Blocked numbers can\'t call or text your second number.',
    highlights: [
      { icon: 'nosign', title: 'Block by number', text: 'Enter any number with its country code and block it.' },
      { icon: 'contactPlus', title: 'Block a contact', text: 'Pick someone straight from your phonebook.' },
      { icon: 'checkCircle', title: 'Unblock anytime', text: 'Change your mind? Unblock with one tap.' },
    ],
    steps: [
      'Open Settings → Call Settings → Blocked numbers.',
      'Enter a number, or tap the contact button to choose someone from your phonebook.',
      'Tap "Block this number". To undo, tap Unblock next to it in the list.',
    ],
    sections: [
      {
        title: 'Block from a conversation',
        text: 'Getting texts you don\'t want? Open the conversation menu and choose Block. A banner in the thread reminds you the number is blocked, with a quick Unblock button.',
      },
      {
        title: 'One list for everything',
        text: 'Every blocked number appears in Blocked numbers, so you can review the list and unblock anyone in one place.',
      },
    ],
    faqs: [
      { q: 'What happens when I block someone?', a: 'They can\'t call or text your second number.' },
      { q: 'Can I block from a message thread?', a: 'Yes. Open the conversation menu and choose Block.' },
      { q: 'How do I unblock a number?', a: 'Go to Settings → Call Settings → Blocked numbers and tap Unblock.' },
    ],
    related: ['anonymous-calling', 'texting', 'second-phone-number'],
    seoTitle: 'Block Unwanted Calls & Texts | Wi-Fi Calling & Texting',
    seoDescription: 'Block unwanted calls and texts on your second number. Add any number or contact to your block list, block right from a conversation, and unblock in one tap.',
  },
];
