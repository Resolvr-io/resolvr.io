"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import PlusIcon from "@heroicons/react/20/solid/PlusIcon";
import { ArrowUpTrayIcon, NewspaperIcon, UserIcon } from "@heroicons/react/24/outline";
import type { Event, Filter } from "nostr-tools";

import { getBountyTags, getTagValues } from "../lib/utils";
import { useBountyEventStore } from "../stores/eventStore";
import { useProfileStore } from "../stores/profileStore";
import { useRelayStore } from "../stores/relayStore";
import { useUserProfileStore } from "../stores/userProfileStore";
import Bounty from "./Bounty";

export default function Bounties() {
  const { subscribe, relayUrl } = useRelayStore();
  const { setProfileEvent } = useProfileStore();
  const { setBountyEvents, getBountyEvents, bountyEvents, setUserEvents, userEvents, bountyType, setBountyType } = useBountyEventStore();
  const { userPublicKey } = useUserProfileStore();
  const [mounted, setMounted] = useState(false);
  const [bountyTags, setBountyTags] = useState<string[]>([]);

  enum BountyType {
    all = "all",
    userPosted = "userPosted",
    assigned = "assigned",
  }

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  function navigateToCreate() {
    router.push("/create");
  }

  const bountyFilter: Filter = {
    kinds: [30050],
    limit: 10,
    until: undefined,
    authors: undefined,
  };

  const getBounties = async () => {
    const events: Event[] = [];
    const pubkeys = new Set();
    bountyFilter.authors = undefined;

    if (bountyEvents[relayUrl]) {
      const lastEvent = bountyEvents[relayUrl].slice(-1)[0];
      bountyFilter.until = lastEvent.created_at - 10;
    }

    const onEvent = (event: Event) => {
      const value = getTagValues("value", event.tags);
      if (value && value.length > 0) {
        events.push(event);
        pubkeys.add(event.pubkey);
      }
    };

    const onEOSE = () => {
      if (bountyEvents[relayUrl]) {
        setBountyEvents(relayUrl, [...bountyEvents[relayUrl], ...events]);
      } else {
        setBountyEvents(relayUrl, events);
      }
      const userFilter = {
        kinds: [0],
        authors: Array.from(pubkeys),
      };

      // getAllBountyTags(events);

      const onEvent = (event: Event) => {
        setProfileEvent(relayUrl, event.pubkey, event);
      };

      const onEOSE = () => {};

      subscribe([relayUrl], userFilter, onEvent, onEOSE);
    };

    subscribe([relayUrl], bountyFilter, onEvent, onEOSE);
  };

  const getPostedBounties = async () => {
    const events: Event[] = [];
    const pubkeys = new Set();
    bountyFilter.authors = [userPublicKey];

    if (userEvents[relayUrl]) {
      const lastEvent = userEvents[relayUrl].slice(-1)[0];
      bountyFilter.until = lastEvent.created_at - 10;
    }

    const onEvent = (event: Event) => {
      const value = getTagValues("value", event.tags);
      if (value && value.length > 0) {
        events.push(event);
        pubkeys.add(event.pubkey);
      }
    };

    const onEOSE = () => {
      if (userEvents[relayUrl]) {
        setUserEvents(relayUrl, [...userEvents[relayUrl], ...events]);
      } else {
        setUserEvents(relayUrl, events);
      }
      const userFilter = {
        kinds: [0],
        authors: Array.from(pubkeys),
      };

      const onEvent = (event: Event) => {
        setProfileEvent(relayUrl, event.pubkey, event);
      };

      const onEOSE = () => {};

      subscribe([relayUrl], userFilter, onEvent, onEOSE);
    };

    subscribe([relayUrl], bountyFilter, onEvent, onEOSE);
  };

  function getBountiesIfEmpty() {
    if (bountyEvents[relayUrl] === undefined) {
      getBounties();
    } else if (bountyEvents[relayUrl].length < 1) {
      getBounties();
    }
  }

  function getPostedBountiesIfEmpty() {
    if (userEvents[relayUrl] === undefined) {
      getPostedBounties();
    }

    if (userEvents[relayUrl] && userEvents[relayUrl].length < 1) {
      getPostedBounties();
    }
  }

  function switchToAll() {
    setBountyType(BountyType.all);
    getBountiesIfEmpty();
  }

  function switchToPosted() {
    setBountyType(BountyType.userPosted);
    getPostedBountiesIfEmpty();
  }

  function getAllBountyTags(events: Event[]) {
    const bountyTagCountMap = new Map<string, number>();
    bountyEvents[relayUrl].forEach((event) => {
      getBountyTags(event.tags).forEach((tag: string) => {
        if (bountyTagCountMap.get(tag)) {
          bountyTagCountMap.set(tag, bountyTagCountMap.get(tag)! + 1);
        } else {
          bountyTagCountMap.set(tag, 1);
        }
      });
    });

    const sortMapByCount = Array.from(bountyTagCountMap.entries())
      .sort((a, b) => {
        return b[1] - a[1];
      })
      .map((entry) => entry[0]);
    setBountyTags(sortMapByCount);
  }

  useEffect(() => {
    if (getBountyEvents(relayUrl).length < 1) {
      getBounties();
    } else {
      getAllBountyTags(bountyEvents[relayUrl]);
    }
  }, []);

  useEffect(() => {
    if (userPublicKey) {
      getPostedBounties();
    }
  }, [userPublicKey, relayUrl]);

  useEffect(() => {
    getBountiesIfEmpty();
  }, [relayUrl]);

  function loadMore() {
    if (bountyType === BountyType.all) {
      getBounties();
    } else if (bountyType === BountyType.userPosted) {
      getPostedBounties();
    }
  }

  function classNames(...classes: any) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-y-8 rounded-lg py-6">
      <div className="flex w-full max-w-4xl flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-medium leading-6 text-gray-800 dark:text-gray-100">Bounties</h1>
          <button
            onClick={navigateToCreate}
            className="flex items-center gap-x-2 rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 "
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Bounty
          </button>
        </div>
        <p className="hidden text-lg text-gray-500 dark:text-gray-400 md:block">Bounties are a way to incentivize work on a project.</p>
      </div>

      <div className="flex w-full max-w-4xl justify-start gap-x-2 overflow-auto border-b border-gray-300 px-2 pb-3 text-gray-600 dark:border-gray-600 dark:text-gray-300 md:overflow-hidden">
        <div
          onClick={switchToAll}
          className={classNames(
            bountyType === BountyType.all
              ? "border-indigo-300 text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
              : "border-transparent hover:text-gray-700 dark:hover:text-gray-200",
            "flex cursor-pointer select-none items-center gap-x-2 border-r border-gray-200 pr-2 hover:text-indigo-600 dark:border-gray-700 dark:hover:text-gray-100"
          )}
        >
          <NewspaperIcon className="h-5 w-5" aria-hidden="true" />
          <span className="whitespace-nowrap">All Bounties</span>
        </div>
        <div
          onClick={switchToPosted}
          className={classNames(
            bountyType === BountyType.userPosted
              ? "border-indigo-300 text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
              : "border-transparent hover:text-gray-700 dark:hover:text-gray-200",
            "flex cursor-pointer select-none items-center gap-x-2 border-r border-gray-200 pr-2 hover:text-indigo-600 dark:border-gray-700 dark:hover:text-gray-100"
          )}
        >
          <ArrowUpTrayIcon className="h-5 w-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Posted Bounties</span>
        </div>
        <div
          className={classNames(
            bountyType === BountyType.assigned
              ? "border-indigo-300 text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
              : "border-transparent hover:text-gray-700 dark:hover:text-gray-200",
            "flex cursor-pointer select-none items-center gap-x-2 pr-2 hover:text-indigo-600 dark:hover:text-gray-100"
          )}
        >
          <UserIcon className="h-5 w-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Assigned Bounties</span>
        </div>
      </div>
      {bountyTags && (
        <div className="flex w-full max-w-4xl justify-start gap-x-2 overflow-auto">
          {Array.from(bountyTags).map((tag: any) => (
            <div
              key={tag}
              className="flex cursor-pointer select-none items-center gap-x-2 rounded-lg text-gray-500 bg-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      {mounted && (
        <ul className="flex w-full max-w-4xl flex-col items-center justify-center gap-y-4 rounded-lg py-6">
          {bountyType === BountyType.all &&
            bountyEvents[relayUrl] &&
            bountyEvents[relayUrl].map((event) => <Bounty key={event.id} event={event} />)}
          {bountyType === BountyType.userPosted &&
            userEvents[relayUrl] &&
            userEvents[relayUrl].map((event) => <Bounty key={event.id} event={event} />)}
        </ul>
      )}
      <button
        onClick={loadMore}
        className="mb-6 flex items-center gap-x-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
      >
        Load More
      </button>
    </div>
  );
}
