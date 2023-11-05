import { SimplePool } from "nostr-tools";

export const POSSIBLE_TAGS = ["All", "Nostr", "Bitcoin", "Lightning", "AI", "Infrastructure", "Other"];

export enum BountyTab {
  all = "all",
  userPosted = "userPosted",
  assigned = "assigned",
}

export enum ReportType {
  Nudity = "nudity",
  Profanity = "profanity",
  Illegal = "illegal",
  Spam = "spam",
  Impersonation = "impersonation",
}

export const RESOLVR_NAMESPACE = "io.resolvr";

export const RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://nostr-pub.wellorder.net",
  "wss://nostr.wine/",
  "wss://nostr.mutinywallet.com",
  "wss://purplepag.es",
  "wss://welcome.nostr.wine",
  "wss://relayable.org",
  "wss://nostr.mom",
  "wss://nostr.plebchain.org",
  "wss://relay.nostriches.org",
  "wss://relay.nostrplebs.com",
  "wss://relay.plebstr.com",
  "wss://relay.nostrati.com",
  "wss://nostr.massmux.com",
  "wss://nostr.inosta.cc",
  "wss://relay.nostr.com.au",
  "wss://nostr.slothy.win",
  "wss://rsslay.nostr.net",
  "wss://relay.f7z.io",
  "wss://rsslay.nostr.moe",
  "wss://nostr.einundzwanzig.space",
  "wss://nostr.swiss-enigma.ch",
  "wss://nostr-relay.derekross.me",
  "wss://sg.qemura.xyz",
  "wss://lightningrelay.com",
  "wss://rly.nostrkid.com",
  "wss://relay.mostr.pub",
  "wss://e.nos.lol",
  "wss://nostr.lu.ke",
  "wss://relay.wellorder.net",
  "wss://nostr-verif.slothy.win",
  "wss://nostr-verified.wellorder.net",
];

export const POOL = new SimplePool();
