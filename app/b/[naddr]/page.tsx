"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

import Applybutton from "@/app/components/Applybutton";
import { getBountyTags, getTagValues, parseProfileContent } from "@/app/lib/utils";
import { useBountyEventStore } from "@/app/stores/eventStore";
import { useProfileStore } from "@/app/stores/profileStore";
import { useRelayStore } from "@/app/stores/relayStore";
import { SatoshiV2Icon } from "@bitcoin-design/bitcoin-icons-react/filled";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { nip19 } from "nostr-tools";
import { Event } from "nostr-tools";
import { AddressPointer } from "nostr-tools/lib/nip19";
// @ts-ignore
import { NoComment } from "react-nocomment";
import colors, { indigo } from "tailwindcss/colors";

import DeleteBounty from "../../components/DeleteBounty";
import { useUserProfileStore } from "../../stores/userProfileStore";
import { Theme } from "../../types";

export default function BountyPage() {
  const { subscribe, relayUrl } = useRelayStore();
  const { getProfileEvent, setProfileEvent } = useProfileStore();
  const { cachedBountyEvent, setCachedBountyEvent } = useBountyEventStore();
  const { getUserPublicKey, userPublicKey } = useUserProfileStore();

  const router = useRouter();

  const [naddr, setNaddr] = useState<string>("");
  const [naddrPointer, setNaddrPointer] = useState<AddressPointer>();
  const [bountyEvent, setBountyEvent] = useState<Event>();
  const [tab, setTab] = useState<string>("details");

  const pathname = usePathname();
  let naddrStr: string = "";
  if (pathname && pathname.length > 60) {
    naddrStr = pathname.split("/").pop() || "";
  }

  useEffect(() => {
    if (naddrStr) {
      const naddr_data: any = nip19.decode(naddrStr).data;
      setNaddr(naddrStr);
      setNaddrPointer(naddr_data);

      if (naddrPointer) {
        if (cachedBountyEvent) {
          setBountyEvent(cachedBountyEvent);
          setCachedBountyEvent(null);
          return;
        }

        let pubkey = "";

        const onEvent = (event: any) => {
          pubkey = event.pubkey;
          setBountyEvent(event);
        };

        const onEOSE = () => {
          const onEvent = (event: Event) => {
            setProfileEvent(relayUrl, event.pubkey, event);
          };

          const onEOSE = () => {};

          const userFilter = {
            kinds: [0],
            authors: [pubkey],
          };

          subscribe([relayUrl], userFilter, onEvent, onEOSE);
        };

        const filter = {
          kinds: [naddrPointer.kind],
          authors: [naddrPointer.pubkey],
          "#d": [naddrPointer.identifier],
        };

        if (naddrPointer.relays) {
          subscribe([naddrPointer.relays[0]], filter, onEvent, onEOSE);
        } else {
          subscribe([relayUrl], filter, onEvent, onEOSE);
        }
      }
    }
  }, [naddr]);

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content || "");
    return result;
  }

  const markdown = setupMarkdown(bountyEvent?.content || "");

  return (
    <div className="px-4 pb-20 pt-10">
      {bountyEvent && (
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-x-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-lg shadow-gray-900/5 ring-1 ring-gray-300 hover:bg-white dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-800 dark:hover:bg-gray-700/50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to all Bounties
          </button>
          <div className="flex flex-col gap-6 border-b border-gray-600 pb-3">
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center text-3xl text-white">
                <div className="text-bitcoin">
                  <SatoshiV2Icon style={{ height: "2rem", width: "2rem" }} />
                </div>
                <span className="text-bitcoin">{parseInt(getTagValues("value", bountyEvent.tags)).toLocaleString()}</span>
              </div>

              <span className="inline-flex items-center gap-x-3 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-600 ring-2 ring-inset ring-gray-300 dark:bg-gray-900 dark:text-white dark:ring-gray-800">
                <svg className="h-2 w-2 fill-yellow-400" viewBox="0 0 6 6" aria-hidden="true">
                  <circle cx={3} cy={3} r={3} />
                </svg>
                Open
              </span>
            </div>

            <div>
              <h2 className="mb-4 text-2xl text-gray-900 dark:text-white">{getTagValues("title", bountyEvent.tags)}</h2>

              <div className="flex justify-between">
                <div className="flex items-center gap-x-4">
                  {bountyEvent?.pubkey && naddrPointer && (
                    <Link
                      className="flex items-center gap-x-2"
                      href={`/u/${nip19.npubEncode(
                        getProfileEvent(naddrPointer.relays ? naddrPointer?.relays[0] : relayUrl, bountyEvent.pubkey)?.pubkey || ""
                      )}`}
                    >
                      <img
                        src={
                          parseProfileContent(
                            getProfileEvent(naddrPointer.relays ? naddrPointer?.relays[0] : relayUrl, bountyEvent.pubkey)?.content
                          )?.picture
                        }
                        alt=""
                        className="h-8 w-8 rounded-full ring-1 ring-white dark:ring-gray-700"
                      />
                      <div className="truncate text-sm font-medium leading-6 text-gray-800 dark:text-white">
                        {
                          parseProfileContent(
                            getProfileEvent(naddrPointer.relays ? naddrPointer?.relays[0] : relayUrl, bountyEvent.pubkey)?.content
                          )?.name
                        }
                      </div>
                    </Link>
                  )}
                </div>

                <div className="flex gap-x-2">
                  {bountyEvent?.pubkey && naddrPointer && (
                    <>
                      {userPublicKey && bountyEvent.pubkey !== userPublicKey && (
                        <>
                          <Link
                            className="flex items-center justify-center rounded-lg bg-gray-400 px-2 text-white hover:bg-gray-500 dark:bg-gray-700/80 dark:hover:bg-gray-700"
                            href={`/messages/${nip19.npubEncode(bountyEvent.pubkey)}`}
                          >
                            <PaperAirplaneIcon className="h-5 w-5" />
                          </Link>
                          <Applybutton bountyEvent={bountyEvent} />
                        </>
                      )}
                      {bountyEvent.pubkey === getUserPublicKey() && (
                        <>
                          <div className="flex cursor-pointer items-center justify-center rounded-lg bg-gray-400 px-2 text-white hover:bg-gray-500 dark:bg-gray-700/80 dark:hover:bg-gray-700">
                            <PencilSquareIcon className="h-5 w-5" />
                          </div>
                          <DeleteBounty
                            eventId={bountyEvent.id}
                            onDelete={() => {
                              router.back();
                            }}
                          ></DeleteBounty>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex divide-x divide-gray-600 px-2 pt-4 dark:text-gray-400">
              <div onClick={() => setTab("details")} className="flex cursor-pointer items-center gap-x-2 pr-2">
                <BookOpenIcon className="h-5 w-5" />
                <h3 className="">Details</h3>
              </div>
              <div onClick={() => setTab("applications")} className="flex cursor-pointer items-center gap-x-2 px-2">
                <UsersIcon className="h-5 w-5" />
                <h3 className="">Applications</h3>
              </div>
              <div onClick={() => setTab("discussion")} className="flex cursor-pointer items-center gap-x-2 pl-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <h3 className="">Discussion</h3>
              </div>
            </div>
          </div>

          {tab === "details" && (
            <>
              <div className="mt-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Bounty Description</h3>

                <div className="flex gap-2 text-sm text-gray-700 dark:text-gray-500">
                  <span>Posted:</span>
                  {new Date(bountyEvent.created_at * 1000).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="mt-6 rounded-lg bg-white p-6 dark:bg-gray-800">
                <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: markdown }} />
              </div>

              <div className="mt-4 flex justify-end gap-x-4">
                {getBountyTags(bountyEvent.tags).map((tag) => (
                  <div
                    key={tag}
                    className="flex cursor-pointer select-none items-center gap-x-2 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "applications" && <div>apps</div>}
          {tab === "discussion" && (
            <div>
              <div className="mt-4">
                <style>
                  {`
                  :root {
                    --nc-primary-color: ${colors.indigo[500]};
                  }
                  :root.${Theme.light} {
                    --nc-text-color: ${colors.gray[900]};
                  }
                  :root.${Theme.dark} {
                    --nc-background: ${colors.gray[800]};
                    --nc-text-background: ${colors.gray[800]};
                    --nc-text-color: ${colors.gray[100]};
                    --nc-text-color: ${colors.gray[100]};
                    --nc-text-color-dark: ${colors.white};
                  }
                `}
                </style>
                <NoComment owner={getUserPublicKey()} relays={[relayUrl]} customBase={naddrStr} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
