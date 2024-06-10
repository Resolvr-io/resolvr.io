"use client";

import { useRelayStore } from "~/store/relay-store";
import { type Event, type Filter } from "nostr-tools";
import { useSubscribe } from "react-nostr";
import { toast } from "sonner";

import BountyCard from "./BountyCard";
import BountyLoadButton from "./BountyLoadButton";

type Props = {
  initialBounties?: Event[];
  filter: Filter;
  eventKey: string;
  tag?: string;
  showProfileInfo?: boolean;
  bitcoinPrice?: number | null;
};

export default function BountiesFeed({
  initialBounties,
  filter,
  eventKey,
  tag,
  showProfileInfo,
  bitcoinPrice,
}: Props) {
  const onEventsNotFound = () => {
    toast("No bounties found", {
      description: "There are no more bounties to display at this time.",
      action: {
        label: "Dismiss",
        onClick: () => console.log("Dismissed toast"),
      },
    });
  };

  const { subRelays } = useRelayStore();

  const { events, status, loading, loadOlderEvents, noEvents } = useSubscribe({
    // initialEvents: initialBounties,
    eventKey,
    filter: filter,
    relays: subRelays,
    onEventsNotFound: onEventsNotFound,
  });

  async function addMorePosts(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    await loadOlderEvents(eventKey, 5);
  }

  return (
    <>
      <ul className="flex w-full flex-col">
        {(events.length > 0 ? events : initialBounties ?? []).map(
          (bountyEvent) => (
            <BountyCard
              key={bountyEvent.id}
              bountyEvent={bountyEvent}
              showProfileInfo={showProfileInfo}
              bitcoinPrice={bitcoinPrice}
            />
          ),
        )}
      </ul>

      <div>
        {noEvents && (
          <div className="flex flex-col items-center justify-center">
            <div className="text-lg font-medium text-gray-500">
              No bounties found
            </div>
            <div className="text-sm text-gray-500">
              There are no bounties to display at this time.
            </div>
          </div>
        )}
      </div>

      <BountyLoadButton
        postsLength={events.length}
        loadFn={addMorePosts}
        loading={loading || status === "fetching"}
      />
    </>
  );
}
