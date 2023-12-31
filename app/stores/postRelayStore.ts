import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type Relay = {
  url: string;
  isActive: boolean;
};

interface RelayState {
  postRelays: Relay[];
  addPostRelay: (url: string, isActive: boolean) => void;
  removePostRelay: (url: string) => void;
  updatePostRelayStatus: (url: string, isActive: boolean) => void;
  checkPostRelayStatus: (url: string) => boolean;
  sortPostRelays: () => void;
  countActivePostRelays: () => number;
  getActivePostRelayURLs: () => string[];
}

export const usePostRelayStore = create<RelayState>()(
  devtools(
    persist(
      (set, get) => ({
        postRelays: [
          { url: "wss://relay.damus.io", isActive: true },
          { url: "wss://nos.lol", isActive: true },
          { url: "wss://nostr-pub.wellorder.net", isActive: true },
          { url: "wss://relay.snort.social", isActive: false },
          { url: "wss://nostr.wine/", isActive: false },
        ],
        addPostRelay: (url, isActive) =>
          set((state) => ({
            postRelays: [...state.postRelays, { url, isActive }],
          })),
        removePostRelay: (url) =>
          set((state) => ({
            postRelays: state.postRelays.filter((relay) => relay.url !== url),
          })),
        updatePostRelayStatus: (url, isActive) =>
          set((state) => {
            const updatedRelays = state.postRelays.map((relay) => (relay.url === url ? { ...relay, isActive } : relay));
            return { postRelays: updatedRelays };
          }),
        checkPostRelayStatus: (url) => get().postRelays.find((relay) => relay.url === url)?.isActive ?? false,
        sortPostRelays: () =>
          set((state) => {
            const sortedRelays = [...state.postRelays].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));
            return { postRelays: sortedRelays };
          }),
        countActivePostRelays: () => get().postRelays.filter((relay) => relay.isActive).length,
        getActivePostRelayURLs: () =>
          get()
            .postRelays.filter((relay) => relay.isActive)
            .map((relay) => relay.url),
      }),
      {
        name: "resolvr-relay-store",
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);
