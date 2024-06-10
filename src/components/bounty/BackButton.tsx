import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "../ui/button";

export default function BackButton() {
  return (
    <Link href="/">
      {/* TODO: route back if routing back to / if not just route to / */}
      <Button
        variant="outline"
        className="flex dark:bg-muted/70 dark:hover:bg-muted/60"
      >
        <ArrowLeftIcon className="mr-1 h-4 w-4" />
        Back to all Bounties
      </Button>
    </Link>
  );
}
