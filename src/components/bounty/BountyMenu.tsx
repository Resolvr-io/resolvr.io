import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import useAuth from "~/hooks/useAuth";
import { useRelayStore } from "~/store/relay-store";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Event, type EventTemplate } from "nostr-tools";
import { finishEvent, usePublish } from "react-nostr";
import { toast } from "sonner";

import { ViewRawDialog } from "../misc/ViewRawDialog";

type Props = {
  bounty: Event;
};

export default function BountyMenu({ bounty }: Props) {
  const { pubkey, seckey } = useAuth();
  const [viewRawOpen, setViewRawOpen] = useState(false);

  const { pubRelays } = useRelayStore();
  const { publish, status, removeEvent } = usePublish({
    relays: pubRelays,
  });

  const router = useRouter();

  async function handleDelete() {
    if (!pubkey) return;

    const tags = [["e", bounty.id]];

    const eventTemplate: EventTemplate = {
      kind: 5,
      tags,
      content: "",
      created_at: Math.floor(Date.now() / 1000),
    };

    const event = await finishEvent(eventTemplate, seckey);

    const onSeen = (_: Event) => {
      void removeEvent(["open", "posted"], bounty.id);
      router.push("/");
      toast("Bounty deleted", {
        description: "Your bounty has been deleted.",
      });
    };

    await publish(event, onSeen);
  }

  async function handleBroadcast() {
    if (!pubkey) return;

    const onSeen = (_: Event) => {
      toast("Bounty was broadcast", {
        description: "Bounty has been broadcast to all publish relays.",
      });
    };

    await publish(bounty, onSeen);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-muted/70 dark:hover:bg-muted/60">
            <MoreVertical className="h-4 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="mt-2">
          <DropdownMenuItem
            onClick={handleBroadcast}
            disabled={status !== "idle"}
          >
            Broadcast
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewRawOpen(true)}>
            View Raw
          </DropdownMenuItem>
          {pubkey === bounty.pubkey && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={status !== "idle"}
                className="dark:text-red-400 dark:focus:bg-red-400/10 dark:focus:text-red-400 "
              >
                Delete Bounty
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ViewRawDialog
        open={viewRawOpen}
        setOpen={setViewRawOpen}
        event={bounty}
      />
    </>
  );
}
