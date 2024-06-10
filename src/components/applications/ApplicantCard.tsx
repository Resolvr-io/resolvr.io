import useAuth from "~/hooks/useAuth";
import { fromNow } from "~/lib/utils";
import { useRelayStore } from "~/store/relay-store";
import { type Event } from "nostr-tools";
import { tag, useBatchedEvents, useBatchedProfiles } from "react-nostr";

import Profile from "../bounty/Profile";
import GithubBadge from "../profile/GithubBadge";
import WebsiteBadge from "../profile/WebsiteBadge";
import AcceptSolutionButton from "./AcceptSolutionButton";
import ApplicantMenu from "./ApplicantMenu";

type Props = {
  applicationEvent: Event;
  bountyEvent: Event;
};

export default function ApplicationCard({
  applicationEvent,
  bountyEvent,
}: Props) {
  const applicantPubkey = applicationEvent.pubkey;
  const { pubkey } = useAuth();
  const { subRelays } = useRelayStore();

  const profileEvent = useBatchedProfiles(applicationEvent.pubkey, subRelays);

  const eventKey = `9735-${applicationEvent.id}`;

  const events = useBatchedEvents(
    9735,
    applicationEvent.id,
    eventKey,
    subRelays,
  );

  return (
    <li className="flex items-center gap-x-4 rounded-md border bg-muted/50 p-4">
      <div className="flex w-full flex-col gap-y-1">
        <span className="flex w-full justify-between pb-1">
          <span className="flex items-center gap-x-2 text-sm font-light text-muted-foreground">
            {applicantPubkey && <Profile pubkey={applicantPubkey} />}
          </span>
          <div className="flex items-center gap-x-1.5">
            {profileEvent &&
              pubkey === bountyEvent.pubkey &&
              tag("s", bountyEvent) === "open" && (
                <AcceptSolutionButton
                  applicationEvent={applicationEvent}
                  bountyEvent={bountyEvent}
                  recipientMetadata={profileEvent}
                />
              )}

            {profileEvent &&
              applicationEvent.id === tag("e", bountyEvent) &&
              tag("s", bountyEvent) === "complete" && (
                <span className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-green-500 dark:text-green-400">
                  Solution Provided
                </span>
              )}

            {events?.[0] && (
              <span className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-green-500 dark:text-green-400">
                Paid
              </span>
            )}

            <ApplicantMenu
              applicantEvent={applicationEvent}
              bountyEvent={bountyEvent}
            />
          </div>
        </span>
        <span className="flex gap-x-1 text-sm text-muted-foreground">
          <span>Applied</span>
          <span>{fromNow(applicationEvent.created_at) ?? "unknown"}</span>
        </span>
        <span className="py-4">{applicationEvent.content}</span>
        <span className="flex w-full justify-start gap-x-1.5 pt-2 text-sm font-light text-muted-foreground">
          <WebsiteBadge pubkey={applicantPubkey} />
          <GithubBadge pubkey={applicantPubkey} />
        </span>
      </div>
    </li>
  );
}
