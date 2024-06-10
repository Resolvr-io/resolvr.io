import { useMemo } from "react";

import { cn, fromNow, pluralize } from "~/lib/utils";
import { useRelayStore } from "~/store/relay-store";
import { BoltIcon, BookOpen, Users, ZapIcon } from "lucide-react";
import Link from "next/link";
import { type Event, type Filter } from "nostr-tools";
import { createATag, tag, useSubscribe, type ATagParams } from "react-nostr";
import { toast } from "sonner";

import ApplicantFeed from "../applications/ApplicantFeed";
import ZapPoll from "../misc/ZapPoll";
import BountyDetails from "./BountyDetails";

type BountyTabsProps = {
  bounty: Event;
  selectedTab: string;
};

type TabProps = {
  selectedTab: string;
  bounty: Event;
};

type ApplicationTabProps = {
  selectedTab: string;
  count: number | undefined | null;
};

function DetailTab({ selectedTab }: TabProps) {
  return (
    <Link
      replace={true}
      key={"details"}
      href={"?tab=details"}
      className={cn(
        selectedTab === "details"
          ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500"
          : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
        "group inline-flex items-center border-b px-1 py-4 text-sm font-medium",
      )}
    >
      <BookOpen
        className={cn(
          selectedTab === "details"
            ? "text-indigo-600 dark:text-indigo-500"
            : "text-muted-foreground group-hover:text-foreground",
          "-ml-0.5 mr-2 h-5 w-5",
        )}
      />
      <span>Details</span>
    </Link>
  );
}

function ApplicationTab({ selectedTab, count }: ApplicationTabProps) {
  return (
    <Link
      replace={true}
      href={"?tab=applications"}
      className={cn(
        selectedTab === "applications"
          ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500"
          : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
        "group inline-flex items-center border-b px-1 py-4 text-sm font-medium",
      )}
    >
      <Users
        className={cn(
          selectedTab === "applications"
            ? "text-indigo-600 dark:text-indigo-500"
            : "text-muted-foreground group-hover:text-foreground",
          "-ml-0.5 mr-2 h-5 w-5",
        )}
      />
      <span className="flex gap-x-1">{pluralize(count, "Hunter")}</span>
    </Link>
  );
}

function ZapPollTab({ selectedTab }: ApplicationTabProps) {
  return (
    <Link
      replace={true}
      href={"?tab=poll"}
      className={cn(
        selectedTab === "poll"
          ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500"
          : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
        "group inline-flex items-center border-b px-1 py-4 text-sm font-medium",
      )}
    >
      <ZapIcon
        className={cn(
          selectedTab === "poll"
            ? "text-indigo-600 dark:text-indigo-500"
            : "text-muted-foreground group-hover:text-foreground",
          "-ml-0.5 mr-2 h-5 w-5",
        )}
      />
      <span className="flex gap-x-1">Zap Poll</span>
    </Link>
  );
}

export default function BountyTabs({ bounty, selectedTab }: BountyTabsProps) {
  const aTagParams: ATagParams = useMemo(
    () => ({
      kind: "30050",
      pubkey: bounty.pubkey,
      dTagValue: tag("d", bounty) ?? "",
    }),
    [bounty],
  );

  const { subRelays } = useRelayStore();

  const aTag = useMemo(() => createATag(aTagParams), [aTagParams]);

  const filter: Filter = {
    kinds: [30051],
    limit: 20,
    "#a": [aTag],
  };

  const onEventsNotFound = () => {
    toast("No applicants found", {
      description: "There are no applicants to display at this time.",
      action: {
        label: "Dismiss",
        onClick: () => console.log("Dismissed toast"),
      },
    });
  };

  const { events, status, loading, loadOlderEvents, noEvents } = useSubscribe({
    eventKey: aTag,
    filter: filter,
    relays: subRelays,
    onEventsNotFound: onEventsNotFound,
  });

  return (
    <div>
      <div className="w-full sm:block">
        <div className="border-b">
          <nav
            className="no-scrollbar -mb-px flex space-x-2 overflow-x-auto sm:space-x-8"
            aria-label="Tabs"
          >
            <DetailTab selectedTab={selectedTab} bounty={bounty} />
            <ApplicationTab selectedTab={selectedTab} count={events?.length} />
            <ZapPollTab selectedTab={selectedTab} count={events?.length} />
          </nav>
        </div>
      </div>
      {selectedTab === "details" && (
        <>
          <div className="flex items-center justify-between">
            <h4 className="scroll-m-20 py-4 text-xl font-semibold tracking-tight">
              Bounty Description
            </h4>
            <span className="text-sm text-muted-foreground">
              {fromNow(bounty?.created_at) ?? "unknown"}
            </span>
          </div>
          {bounty?.content && <BountyDetails bounty={bounty} />}
        </>
      )}
      {selectedTab === "applications" && (
        <>
          <div className="flex items-center justify-between">
            <h4 className="scroll-m-20 py-4 text-xl font-semibold tracking-tight">
              Participants
            </h4>
            <span className="text-sm text-muted-foreground">
              {fromNow(bounty?.created_at) ?? "unknown"}
            </span>
          </div>
          {bounty && (
            <ApplicantFeed
              bounty={bounty}
              applicationEvents={events}
              eventKey={aTag}
              loadOlderEvents={loadOlderEvents}
              loading={loading}
              noEvents={noEvents}
              status={status}
            />
          )}
        </>
      )}
      <>
        <h4 className="scroll-m-20 py-4 text-xl font-semibold tracking-tight">
          Zap Poll
        </h4>
        {selectedTab === "poll" && <ZapPoll bountyEvent={bounty} />}
      </>
    </div>
  );
}
