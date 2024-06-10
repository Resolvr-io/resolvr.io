/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @next/next/no-img-element */

import { BOT_AVATAR_ENDPOINT } from "~/lib/constants";
import { fromNow } from "~/lib/utils";
import { useRelayStore } from "~/store/relay-store";
import { User } from "lucide-react";
import Link from "next/link";
import { type Event } from "nostr-tools";
import {
  createNaddr,
  profileContent,
  shortNpub,
  tag,
  useBatchedProfiles,
} from "react-nostr";

import ApplicationCount from "../applications/ApplicationCount";
import Zap from "../ui/icons/zap";

type Props = {
  bountyEvent: Event;
  showProfileInfo?: boolean;
  bitcoinPrice?: number | null;
};

export default function BountyCard({
  bountyEvent,
  showProfileInfo = true,
  bitcoinPrice,
}: Props) {
  const pubkey = bountyEvent.pubkey;
  const { subRelays } = useRelayStore();

  const profileEvent = useBatchedProfiles(bountyEvent.pubkey, subRelays);
  return (
    <Link href={`/b/${createNaddr(bountyEvent, subRelays)}`}>
      <li className="flex cursor-pointer items-center gap-x-4 rounded-md p-2.5 hover:bg-muted md:p-6">
        <div className="flex w-full flex-col">
          {showProfileInfo ? (
            <span className="text-base text-card-foreground">
              {tag("title", bountyEvent)}
            </span>
          ) : (
            <span className="flex w-full justify-between pb-1">
              <span className="text-base text-card-foreground">
                {tag("title", bountyEvent)}
              </span>
              {/* {tag("t", bountyEvent) && ( */}
              {/*   <Badge variant="outline">{tag("t", bountyEvent)}</Badge> */}
              {/* )} */}
            </span>
          )}
          <div className="mt-2 flex flex-row items-center gap-2 text-sm font-light text-muted-foreground">
            {showProfileInfo && (
              <img
                src={
                  profileContent(profileEvent).picture ||
                  BOT_AVATAR_ENDPOINT + pubkey
                }
                alt=""
                className="aspect-square w-5 rounded-md border border-border dark:border-border"
              />
            )}
            {showProfileInfo && (
              <span className="flex justify-between">
                <span>
                  {profileContent(profileEvent).name || shortNpub(pubkey)}
                </span>
                {/* {tag("t", bountyEvent) && ( */}
                {/*   <Badge variant="outline">{tag("t", bountyEvent)}</Badge> */}
                {/* )} */}
              </span>
            )}

            <span>{fromNow(bountyEvent.created_at) ?? "unknown"}</span>
            <span className="flex items-center gap-x-1">
              <User className="h-4 w-4" />
              <ApplicationCount bounty={bountyEvent} />
            </span>
          </div>
          <div className="bg-bitcoin-background text-bitcoin mt-3 flex items-center gap-2 self-start rounded-md px-3 py-2 text-lg font-semibold">
            <div className="flex flex-row items-center">
              <Zap className="h-5 w-5" />
              <span>{Number(tag("reward", bountyEvent)).toLocaleString()}</span>
            </div>
            {bitcoinPrice && (
              <span className="text-md font-normal text-black dark:text-white">
                $
                {(
                  Number(tag("reward", bountyEvent)) *
                  bitcoinPrice *
                  0.00000001
                )
                  .toFixed(2)
                  .toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </li>
    </Link>
  );
}
