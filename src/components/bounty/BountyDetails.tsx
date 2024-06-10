import { useEffect, useState } from "react";

import useAuth from "~/hooks/useAuth";
import { useRelayStore } from "~/store/relay-store";
import { useParams } from "next/navigation";
import { nip19, type Event } from "nostr-tools";
import Markdown from "react-markdown";
// @ts-expect-error no types
import { NoComment } from "react-nocomment-fork";

type Props = {
  bounty: Event;
};

export default function BountyDetails({ bounty }: Props) {
  const { pubkey, seckey } = useAuth();
  const params = useParams();
  const { subRelays } = useRelayStore();
  const [npub, setNpub] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!pubkey) return;
    const npub = nip19.npubEncode(pubkey);
    if (npub) {
      setNpub(npub);
    }
  }, [pubkey]);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="min-h-[12rem] w-full rounded-md border border-input bg-muted/20">
        <article className="prose prose-sm w-full p-4 dark:prose-invert">
          <Markdown>{bounty.content}</Markdown>
        </article>
      </div>
      {pubkey && (
        <NoComment
          publicKey={pubkey}
          privateKey={seckey}
          customBase={params.naddr}
          relays={subRelays}
          owner={npub}
        />
      )}
    </div>
  );
}
