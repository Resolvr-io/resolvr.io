"use server";

import { revalidateTag } from "next/cache";

const revalidateCachedTag = (tag: string) => {
  revalidateTag(tag);
};

const validateGithub = async (npub: string, github: string, gist: string) => {
  try {
    const res = await (
      await fetch(`https://gist.github.com/${github}/${gist}/raw`)
    ).text();
    return (
      res.trim() ===
      `Verifying that I control the following Nostr public key: ${npub}`
    );
  } catch (_) {
    return false;
  }
};

const getBitcoinPrice = async () => {
  try {
    const response = await fetch(
      "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=1",
      {
        headers: {
          "X-CMC_PRO_API_KEY": `${process.env.CMC_API_KEY}`,
        },
      },
    );

    const json = (await response.json()) as {
      data: {
        "1": {
          quote: {
            USD: {
              price: number;
            };
          };
        };
      };
    };

    return json.data["1"].quote.USD.price;
  } catch (_) {
    return _;
  }
};

export { revalidateCachedTag, validateGithub, getBitcoinPrice };
