import React, { useEffect } from "react";

import { validateGithub } from "~/server";
import { useRelayStore } from "~/store/relay-store";
import { CheckCircle, Github } from "lucide-react";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { identityTag, profileContent, useBatchedProfiles } from "react-nostr";

import { Badge } from "../ui/badge";

type Props = {
  pubkey: string;
};

export default function GithubBadge({ pubkey }: Props) {
  const [githubVerified, setGithubVerified] = React.useState<boolean>(false);

  const { subRelays } = useRelayStore();
  const profileEvent = useBatchedProfiles(pubkey, subRelays);

  useEffect(() => {
    if (githubVerified) return;

    const gist = identityTag("github", profileEvent?.tags ?? [])?.[2];
    const github = profileContent(profileEvent).github;
    const npub = nip19.npubEncode(pubkey);

    if (!github) return;
    if (!gist) return;

    async function fetchValidateGithub(
      npub: string,
      github: string,
      gist: string,
    ) {
      const validGist = await validateGithub(npub, github, gist);
      setGithubVerified(validGist);
    }

    void fetchValidateGithub(npub, github, gist);
  }, [githubVerified, profileEvent, pubkey]);

  if (!profileContent(profileEvent).github) return null;

  if (!githubVerified) return null;

  if (githubVerified) {
    return (
      <Link
        prefetch={false}
        href={`https://${profileContent(profileEvent).github}` ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="relative"
      >
        <Badge
          className="aspect-square text-xs sm:aspect-auto"
          variant="secondary"
        >
          <Github className="h-4 w-4 sm:mr-1" />
          <span className="hidden truncate sm:block">
            {profileContent(profileEvent).github}
          </span>
        </Badge>
        <CheckCircle className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full bg-muted/100 text-green-400 ring-2 ring-secondary/0" />
      </Link>
    );
  }
}
