import BountyFeed from "~/components/bounty-feed/BountyFeed";
import BountyTags from "~/components/bounty-feed/BountyTags";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { type Filter } from "nostr-tools";

import { authOptions } from "../api/auth/[...nextauth]/auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const selectedTab = searchParams.tab ?? "open";

  const session = await getServerSession(authOptions);
  let loggedIn = false;
  let publicKey = "";

  if (session?.user) {
    const user = session?.user as UserWithKeys;
    publicKey = user.publicKey;
    if (publicKey) {
      loggedIn = true;
    }
  }

  const filter: Filter = {
    kinds: [30050],
    limit: 10,
  };

  if (selectedTab === "open") {
    filter["#s"] = ["open"];
  }

  if (selectedTab === "posted") {
    filter.authors = [publicKey];
  }

  if (selectedTab === "assigned") {
    filter["#p"] = [publicKey];
  }

  const bitcoinPrice = parseFloat(
    await (await fetch("https://blockchain.info/q/24hrprice")).text(),
  );

  return (
    <div className="w-full flex-col items-center">
      {loggedIn && (
        <div className="flex flex-col py-4">
          {/* BUG: fix tabs not updating sometimes */}
          <Tabs defaultValue={selectedTab}>
            <div className="flex items-center justify-between">
              <h1 className="select-none text-center text-3xl font-bold">
                Bounties
              </h1>
              <div className="mr-1 flex items-center">
                <TabsList className="bg-muted">
                  <TabsTrigger asChild value="open">
                    <Link href={"?tab=open"} replace={true}>
                      Open
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger asChild value="posted">
                    <Link href={"?tab=posted"} replace={true}>
                      Posted
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </Tabs>

          <div className="mb-2 mt-3 flex gap-x-2">
            <BountyTags />
            {/* <BountyFilter /> */}
          </div>
        </div>
      )}

      <BountyFeed
        initialBounties={[]}
        filter={filter}
        eventKey={selectedTab}
        bitcoinPrice={bitcoinPrice}
      />
    </div>
  );
}
