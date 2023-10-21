import type { Event } from "nostr-tools";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface BountyEventState {
  bountyEvents: Record<string, Array<Event>>;
  setBountyEvents: (key: string, bountyEvents: Array<Event>) => void;
  getBountyEvents: (key: string) => Array<Event>;
  cachedBountyEvent: Event | null;
  setCachedBountyEvent: (bounty: Event | null) => void;
  getCachedBountyEvent: () => Event | null;

  userEvents: Record<string, Array<Event>>;
  setUserEvents: (key: string, userEvents: Array<Event>) => void;
  getUserEvents: (key: string) => Array<Event>;
  cachedUserEvent: Event | null;
  setCachedUserEvent: (userEvent: Event | null) => void;
  getCachedUserEvent: () => Event | null;
}

export const useBountyEventStore = create<BountyEventState>()(
  devtools(
    persist(
      (set, get) => ({
        bountyEvents: {},
        setBountyEvents: (key, bountyEvents) => set((prev) => ({ bountyEvents: { ...prev.bountyEvents, [key]: bountyEvents } })),
        getBountyEvents: (key: string) => get().bountyEvents[key] ?? [],
        cachedBountyEvent: null,
        setCachedBountyEvent: (bounty) => set({ cachedBountyEvent: bounty }),
        getCachedBountyEvent: () => get().cachedBountyEvent,

        userEvents: {},
        setUserEvents: (key, userEvents) => set((prev) => ({ userEvents: { ...prev.userEvents, [key]: userEvents } })),
        getUserEvents: (key: string) => get().userEvents[key] ?? [],
        cachedUserEvent: null,
        setCachedUserEvent: (userEvent) => set({ cachedUserEvent: userEvent }),
        getCachedUserEvent: () => get().cachedUserEvent,
      }),
      {
        name: "resolvr-bounty-event-storage",
        storage: createJSONStorage(() => sessionStorage),
      }
    )
  )
);
