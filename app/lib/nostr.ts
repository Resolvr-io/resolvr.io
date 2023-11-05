import Fuse from "fuse.js";
import { Event, Filter, Kind } from "nostr-tools";

import { useBountyEventStore } from "../stores/eventStore";
import { useProfileStore } from "../stores/profileStore";
import { useRelayStore } from "../stores/relayStore";
import { getTagValues } from "./utils";

const { getApplicantEvent, setApplicantEvent, setZapReceiptEvent, taggedBountyEvents, setTaggedBountyEvents } =
  useBountyEventStore.getState();
const { setProfileEvent } = useProfileStore.getState();
const { relayUrl, subscribe } = useRelayStore.getState();

export function retrieveProfiles(pubkey: string[]) {
  const onEvent = (event: Event) => {
    setProfileEvent(relayUrl, event.pubkey, event);
  };

  const onEOSE = () => {};

  const userFilter: Filter = {
    kinds: [0],
    authors: pubkey,
  };

  subscribe([relayUrl], userFilter, onEvent, onEOSE);
}

export function getApplicants(dValues: Set<string>) {
  const applicantFilter: Filter = {
    kinds: [8050],
    "#d": Array.from(dValues),
    limit: 1000,
  };

  const onApplicantEvent = (event: Event) => {
    const dValue = getTagValues("d", event.tags);

    const cachedApplicationEvent = getApplicantEvent(relayUrl, dValue, event.pubkey);
    if (!cachedApplicationEvent) {
      setApplicantEvent(relayUrl, dValue, event.pubkey, event);
    }
  };

  const onApplicantEOSE = () => {};

  subscribe([relayUrl], applicantFilter, onApplicantEvent, onApplicantEOSE);
}

export async function getZapEndpoint(metadata: Event<Kind.Metadata>): Promise<null | string> {
  try {
    let lnurl: string = "";
    let { lud16 } = JSON.parse(metadata.content);
    if (lud16) {
      let [name, domain] = lud16.split("@");
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    } else {
      return null;
    }

    let res = await fetch(lnurl);
    let body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch (err) {
    /*-*/
  }

  return null;
}

export const fetchInvoice = async (zapEndpoint: any, zapEvent: any) => {
  const comment = zapEvent.content;
  const amount = getTagValues("amount", zapEvent.tags);

  let url = `${zapEndpoint}?amount=${amount}&nostr=${encodeURIComponent(JSON.stringify(zapEvent))}`;

  if (comment) {
    url = `${url}&comment=${encodeURIComponent(comment)}`;
  }

  const res = await fetch(url);
  const { pr: invoice } = await res.json();

  return invoice;
};

export const getZapRecieptFromRelay = async (cachedBountyEvent: Event) => {
  console.log("CALLING GET ZAP RECIEPT FROM RELAY");
  if (cachedBountyEvent) {
    const postedBountyFilter: Filter = {
      kinds: [9735],
      limit: 100,
      "#e": [cachedBountyEvent.id],
    };

    const onEvent = (event: Event) => {
      console.log("zap reciept event", event);
      const bountyValue = getTagValues("reward", cachedBountyEvent.tags);
      const zapEvent = JSON.parse(getTagValues("description", event.tags));
      const zapAmount = getTagValues("amount", zapEvent.tags);
      if (Number(bountyValue) === Number(zapAmount) / 1000) {
        console.log("caching zap reciept event", event);
        setZapReceiptEvent(relayUrl, cachedBountyEvent.id, event);
      }
    };

    const onEOSE = () => {};

    subscribe([relayUrl], postedBountyFilter, onEvent, onEOSE);
  }
};

export const filterBounties = (search: string, list: Event[]) => {
  const options = {
    keys: ["content", "tags"],
    includeScore: true,
    distance: 100000,
    includeMatches: true,
    minMatchCharLength: 1,
    threshold: 0.1,
    // ignoreLocation: true,
  };

  if (!search) {
    return list;
  }

  const fuse = new Fuse(list, options);
  const result = fuse.search(search);
  return result.map((r) => r.item);
};

export const filterReportedBounties = (bountyEvents: Event[], reportedBountyEvents: Event[]) => {
  const REPORT_THRESHOLD = 0;
  if (REPORT_THRESHOLD <= 0) {
    return bountyEvents;
  }

  type Count = {
    [key: string]: {
      count: number;
      reportedBy: Set<string>;
    };
  };

  const reportedByCount = reportedBountyEvents.reduce((obj, event) => {
    const reportedId = event.tags?.find((tag) => tag[0] === "e")![1];

    if (reportedId) {
      const reporterPubkey = event.pubkey;
      if (obj.reportedId) {
        if (!obj.reportedId.reportedBy.has(reporterPubkey)) {
          return {
            ...obj,
            [reportedId]: {
              count: obj.reportedId.count + 1,
              reportedBy: new Set(obj.reportedId.reportedBy).add(reporterPubkey),
            },
          };
        } else {
          return obj;
        }
      } else {
        return {
          ...obj,
          [reportedId]: {
            count: 1,
            reportedBy: new Set<string>().add(reporterPubkey),
          },
        };
      }
    }
    return obj;
  }, {} as Count);

  const difference = bountyEvents.filter((bounty) => {
    if (reportedByCount[bounty.id]) {
      return reportedByCount[bounty.id].count < REPORT_THRESHOLD;
    }
    return true;
  });

  return difference;
};

export const getTaggedBounties = async (tag: string, loading: any, setLoading: any) => {
  if (taggedBountyEvents[relayUrl] && taggedBountyEvents[relayUrl][tag] && taggedBountyEvents[relayUrl][tag].length === 0) {
    setLoading({ ...loading, all: true });
  } else {
    setLoading({ ...loading, all: false });
  }

  const taggedBountyFilter: Filter = {
    kinds: [30050],
    limit: 10,
    until: undefined,
    "#s": ["open"],
    "#t": [tag],
  };
  const events: Event[] = [];
  const pubkeys = new Set<string>();
  const dValues = new Set<string>();

  if (taggedBountyEvents[relayUrl] && taggedBountyEvents[relayUrl][tag]) {
    const lastEvent = taggedBountyEvents[relayUrl][tag].slice(-1)[0];
    if (lastEvent) {
      taggedBountyFilter.until = lastEvent.created_at - 10;
    }
  }

  const onEvent = (event: Event) => {
    // TODO: check for zap recipt
    const value = getTagValues("reward", event.tags);
    if (value && value.length > 0) {
      events.push(event);
      pubkeys.add(event.pubkey);
      dValues.add(getTagValues("d", event.tags));
    }
  };

  const onEOSE = () => {
    if (taggedBountyEvents[relayUrl] && taggedBountyEvents[relayUrl][tag]) {
      setTaggedBountyEvents(relayUrl, tag, [...taggedBountyEvents[relayUrl][tag], ...events]);
    } else {
      setTaggedBountyEvents(relayUrl, tag, events);
    }

    retrieveProfiles(Array.from(pubkeys));
    getApplicants(dValues);
    setLoading({ ...loading, all: false });
  };

  subscribe([relayUrl], taggedBountyFilter, onEvent, onEOSE);
};
