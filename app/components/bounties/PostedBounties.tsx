"use client";

import { useEffect, useState } from "react";

import BountyPlaceholder from "@/app/components/Skeleton/Bounty";
import type { Event, Filter } from "nostr-tools";

import { BountyTab } from "../../lib/constants";
import { filterBounties, filterReportedBounties, getApplicants, retrieveProfiles } from "../../lib/nostr";
import { getTagValues } from "../../lib/utils";
import { useBountyEventStore } from "../../stores/eventStore";
import { useRelayStore } from "../../stores/relayStore";
import { useUserProfileStore } from "../../stores/userProfileStore";
import Bounty from "./Bounty";
import LoadBountiesButton from "./LoadBountiesButton";
import NoBounties from "./NoBounties";

export default function Bounties() {
  const { subscribe, relayUrl } = useRelayStore();
  const { setUserEvents, userEvents, bountyType, search, reportedBountyEvents } = useBountyEventStore();
  const { userPublicKey } = useUserProfileStore();
  const [loading, setLoading] = useState({ posted: false });

  const getPostedBounties = async () => {
    if (userPublicKey && !userEvents[relayUrl]) {
      setLoading({ ...loading, posted: true });
    }

    const events: Event[] = [];
    const pubkeys = new Set<string>();
    const dValues = new Set<string>();

    const postedBountyFilter: Filter = {
      kinds: [30050],
      limit: 10,
      until: undefined,
    };

    postedBountyFilter.authors = [userPublicKey];

    if (userEvents[relayUrl]) {
      const lastEvent = userEvents[relayUrl].slice(-1)[0];
      if (lastEvent) {
        postedBountyFilter.until = lastEvent.created_at - 10;
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
      if (userEvents[relayUrl]) {
        setUserEvents(relayUrl, [...userEvents[relayUrl], ...events]);
      } else {
        setUserEvents(relayUrl, events);
      }
      retrieveProfiles(Array.from(pubkeys));
      getApplicants(dValues);
      setLoading({ ...loading, posted: false });
    };

    subscribe([relayUrl], postedBountyFilter, onEvent, onEOSE);
  };

  useEffect(() => {
    if (userPublicKey) {
      getPostedBounties();
    }
  }, [userPublicKey, relayUrl]);

  return (
    <>
      {loading.posted
        ? Array.from(Array(5)).map((i) => <BountyPlaceholder key={i} />)
        : bountyType === BountyTab.userPosted &&
          userEvents[relayUrl] &&
          userPublicKey &&
          (userEvents[relayUrl].length ? (
            filterBounties(search, filterReportedBounties(userEvents[relayUrl], reportedBountyEvents[relayUrl])).map((event) => (
              <Bounty key={event.id} event={event} />
            ))
          ) : (
            <NoBounties />
          ))}
      <LoadBountiesButton action={getPostedBounties} />
    </>
  );
}
