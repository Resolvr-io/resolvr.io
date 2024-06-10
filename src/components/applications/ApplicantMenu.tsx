import { useMemo, useState } from "react";

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
import { type Event, type EventTemplate } from "nostr-tools";
import {
  createATag,
  finishEvent,
  tag,
  usePublish,
  type ATagParams,
} from "react-nostr";
import { toast } from "sonner";

import { ViewRawDialog } from "../misc/ViewRawDialog";

type Props = {
  applicantEvent: Event;
  bountyEvent: Event;
};

export default function ApplicantMenu({ applicantEvent, bountyEvent }: Props) {
  const { pubkey, seckey } = useAuth();
  const { pubRelays } = useRelayStore();

  const [viewRawOpen, setViewRawOpen] = useState(false);

  const { publish, status, removeEvent } = usePublish({
    relays: pubRelays,
  });

  const aTagParams: ATagParams = useMemo(
    () => ({
      kind: "30050",
      pubkey: bountyEvent.pubkey,
      dTagValue: tag("d", bountyEvent) ?? "",
    }),
    [bountyEvent],
  );

  const aTag = useMemo(() => createATag(aTagParams), [aTagParams]);

  async function handleDelete() {
    if (!pubkey) return;

    const tags = [["e", applicantEvent.id]];

    const eventTemplate: EventTemplate = {
      kind: 5,
      tags,
      content: "",
      created_at: Math.floor(Date.now() / 1000),
    };

    const event = await finishEvent(eventTemplate, seckey);

    const onSeen = (_: Event) => {
      void removeEvent([aTag, `applied-${aTag}`], applicantEvent.id);
      toast("Application deleted", {
        description: "Your application has been deleted.",
      });
    };

    await publish(event, onSeen);
  }

  async function handleBroadcast() {
    if (!pubkey) return;

    const onSeen = (_: Event) => {
      toast("Application was broadcast", {
        description: "Application has been broadcast to all publish relays.",
      });
    };

    await publish(applicantEvent, onSeen);
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
          {pubkey === applicantEvent.pubkey && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={status !== "idle"}
                className="dark:text-red-400 dark:focus:bg-red-400/10 dark:focus:text-red-400 "
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ViewRawDialog
        open={viewRawOpen}
        setOpen={setViewRawOpen}
        event={applicantEvent}
      />
    </>
  );
}
