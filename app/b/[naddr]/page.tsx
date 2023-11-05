"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

import Applicant from "@/app/components/Applicant";
import Applybutton from "@/app/components/Applybutton";
import ReportButton from "@/app/components/ReportButton";
import { getApplicants, getZapRecieptFromRelay, retrieveProfiles } from "@/app/lib/nostr";
import { getBountyTags, getTagValues, parseProfileContent, shortenHash } from "@/app/lib/utils";
import Avatar from "@/app/messages/components/Avatar";
import { useBountyEventStore } from "@/app/stores/eventStore";
import { useProfileStore } from "@/app/stores/profileStore";
import { useRelayStore } from "@/app/stores/relayStore";
import { SatoshiV2Icon } from "@bitcoin-design/bitcoin-icons-react/filled";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
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
  const { getProfileEvent } = useProfileStore();
  const { cachedBountyEvent, setCachedBountyEvent, getBountyApplicants, getApplicantEvent, getZapReceiptEvent } = useBountyEventStore();
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
          return;
        }

        const onEvent = (event: any) => {
          setBountyEvent(event);
          retrieveProfiles([event.pubkey]);
          const dValues = new Set<string>();
          dValues.add(getTagValues("d", event.tags));
          getApplicants(dValues);
          setCachedBountyEvent(event);
        };

        const onEOSE = () => {};

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
  }, [naddr, cachedBountyEvent]);

  useEffect(() => {
    if (!cachedBountyEvent) {
      return;
    }
    // TODO: check value against bounty value
    if (!getZapReceiptEvent(relayUrl, cachedBountyEvent.id)) {
      getZapRecieptFromRelay(cachedBountyEvent);
    }
  }, [cachedBountyEvent]);

  useEffect(() => {
    return () => {
      setCachedBountyEvent(null);
    };
  }, []);

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content || "");
    return result;
  }

  const markdown = setupMarkdown(bountyEvent?.content || "");

  function classNames(...classes: any) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <div className="px-4 pb-20 pt-10">
      {bountyEvent && (
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/`}
            className="flex w-48 items-center gap-x-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-lg shadow-gray-900/5 ring-1 ring-gray-300 hover:bg-white dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-800 dark:hover:bg-gray-700/50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to all Bounties
          </Link>
          <div className="flex flex-col gap-6 border-b border-gray-600 pb-3">
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center text-3xl text-white">
                <div className="text-bitcoin">
                  <SatoshiV2Icon style={{ height: "2rem", width: "2rem" }} />
                </div>
                <span className="text-bitcoin">{parseInt(getTagValues("reward", bountyEvent.tags)).toLocaleString()}</span>
              </div>

              <span className="inline-flex items-center gap-x-3 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-600 ring-2 ring-inset ring-gray-300 dark:bg-gray-900 dark:text-white dark:ring-gray-800">
                {getTagValues("s", bountyEvent.tags) === "open" && (
                  <>
                    <svg className="h-2 w-2 fill-yellow-400" viewBox="0 0 6 6" aria-hidden="true">
                      <circle cx={3} cy={3} r={3} />
                    </svg>

                    <span className="text-gray-700 dark:text-gray-300">Open</span>
                  </>
                )}
                {cachedBountyEvent &&
                  getTagValues("s", bountyEvent.tags) === "assigned" &&
                  !getZapReceiptEvent(relayUrl, cachedBountyEvent.id) && (
                    <>
                      <svg className="h-2 w-2 fill-blue-400" viewBox="0 0 6 6" aria-hidden="true">
                        <circle cx={3} cy={3} r={3} />
                      </svg>

                      <span className="text-gray-700 dark:text-gray-300">Assigned</span>
                    </>
                  )}
                {getTagValues("s", bountyEvent.tags) === "withdrawn" && (
                  <>
                    <svg className="h-2 w-2 fill-red-400" viewBox="0 0 6 6" aria-hidden="true">
                      <circle cx={3} cy={3} r={3} />
                    </svg>

                    <span className="text-gray-700 dark:text-gray-300">Withdrawn</span>
                  </>
                )}

                {cachedBountyEvent &&
                  (getTagValues("s", bountyEvent.tags) === "assigned" || getTagValues("s", bountyEvent.tags) === "complete") &&
                  getZapReceiptEvent(relayUrl, cachedBountyEvent.id) && (
                    <>
                      <svg className="h-2 w-2 fill-green-400" viewBox="0 0 6 6" aria-hidden="true">
                        <circle cx={3} cy={3} r={3} />
                      </svg>

                      <span className="text-gray-700 dark:text-gray-300">Bounty Paid</span>
                    </>
                  )}
              </span>
            </div>

            <div>
              <h2 className="mb-4 text-2xl text-gray-900 dark:text-white">{getTagValues("title", bountyEvent.tags)}</h2>

              <div className="flex justify-between">
                <div className="flex items-center gap-x-4">
                  {bountyEvent?.pubkey && naddrPointer && (
                    <Link className="flex items-center gap-x-2" href={`/u/${nip19.npubEncode(bountyEvent.pubkey)}`}>
                      <Avatar
                        src={
                          parseProfileContent(
                            getProfileEvent(naddrPointer.relays ? naddrPointer?.relays[0] : relayUrl, bountyEvent.pubkey)?.content
                          )?.picture
                        }
                        seed={bountyEvent.pubkey}
                        className="h-8 w-8 ring-1 ring-white dark:ring-gray-700"
                      />
                      <div className="truncate text-sm font-medium leading-6 text-gray-800 dark:text-white">
                        {parseProfileContent(
                          getProfileEvent(naddrPointer.relays ? naddrPointer?.relays[0] : relayUrl, bountyEvent.pubkey)?.content
                        )?.name || shortenHash(nip19.npubEncode(bountyEvent.pubkey))}
                      </div>
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-x-2">
                  {bountyEvent?.pubkey && naddrPointer && (
                    <>
                      {userPublicKey && bountyEvent.pubkey !== userPublicKey && (
                        <>
                          {/* <Link */}
                          {/*   className="flex items-center justify-center rounded-lg bg-gray-400 px-2 text-white hover:bg-gray-500 dark:bg-gray-700/80 dark:hover:bg-gray-700" */}
                          {/*   href={`/messages/${nip19.npubEncode(bountyEvent.pubkey)}`} */}
                          {/* > */}
                          {/*   <PaperAirplaneIcon className="h-5 w-5" /> */}
                          {/* </Link> */}
                          {
                            // TODO: check if user has already applied
                            getApplicantEvent(relayUrl, getTagValues("d", bountyEvent.tags), userPublicKey) ? (
                              <span className="select-none text-green-500 dark:text-green-400">Applied</span>
                            ) : (
                              <Applybutton bountyEvent={bountyEvent} />
                            )
                          }
                        </>
                      )}

                      {bountyEvent.pubkey === getUserPublicKey() && (
                        <>
                          {/* <div className="flex cursor-pointer items-center justify-center rounded-lg bg-gray-400 px-2 text-white hover:bg-gray-500 dark:bg-gray-700/80 dark:hover:bg-gray-700"> */}
                          {/*   <PencilSquareIcon className="h-5 w-5" /> */}
                          {/* </div> */}
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
            <div className="flex pt-4 dark:text-gray-400">
              <div className="flex w-full flex-row divide-x divide-gray-600 px-2 ">
                <div
                  onClick={() => setTab("details")}
                  className={classNames(
                    tab === "details"
                      ? "border-indigo-300 text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
                      : "border-transparent hover:text-gray-700 dark:hover:text-gray-200",
                    "flex cursor-pointer select-none items-center gap-x-2 border-r border-gray-200 pr-2 hover:text-indigo-600 dark:border-gray-700 dark:hover:text-gray-100"
                  )}
                >
                  <BookOpenIcon className="h-5 w-5" />
                  <h3 className="">Details</h3>
                </div>
                <div
                  onClick={() => setTab("applications")}
                  className={classNames(
                    tab === "applications"
                      ? "border-indigo-300 text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
                      : "border-transparent hover:text-gray-700 dark:hover:text-gray-200",
                    "flex cursor-pointer select-none items-center gap-x-2 border-r border-gray-200 px-2 hover:text-indigo-600 dark:border-gray-700 dark:hover:text-gray-100"
                  )}
                >
                  <UsersIcon className="h-5 w-5" />
                  <h3>Applications ({Object.values(getBountyApplicants(relayUrl, getTagValues("d", bountyEvent.tags))).length})</h3>
                </div>
                <div
                  onClick={() => setTab("discussion")}
                  className={classNames(
                    tab === "discussion"
                      ? "border-indigo-300 text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
                      : "border-transparent hover:text-gray-700 dark:hover:text-gray-200",
                    "flex cursor-pointer select-none items-center gap-x-2 border-r border-gray-200 pl-2 hover:text-indigo-600 dark:border-gray-700 dark:hover:text-gray-100"
                  )}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  <h3 className="">Discussion</h3>
                </div>
              </div>
              {userPublicKey !== bountyEvent.pubkey && (
                <div className="ml-auto">
                  <ReportButton event={bountyEvent}></ReportButton>
                </div>
              )}
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
          {tab === "applications" && (
            <div className="mt-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Applicants</h3>
              <div className="mt-6 flex flex-col gap-y-4">
                {Object.values(getBountyApplicants(relayUrl, getTagValues("d", bountyEvent.tags))).map((applicantEvent) => (
                  <Applicant key={applicantEvent.pubkey} applicantEvent={applicantEvent} />
                ))}
              </div>
            </div>
          )}
          {tab === "discussion" && (
            <div className="mt-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Discussion</h3>
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
