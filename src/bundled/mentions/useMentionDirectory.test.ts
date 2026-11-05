import { expect, it, vi } from "vitest";
import type { ComposerSession } from "../../features/messages/composer-session";
import { fetchMentionDirectoryPage } from "./useMentionDirectory";

it("keeps a verified person when a refined query matches only their verified full name", async () => {
  const fake = { pubkey: "a".repeat(64), name: "Fake" };
  const other = { pubkey: "b".repeat(64), name: "Fake" };
  const shared = new Map([
    [
      fake.pubkey,
      {
        name: "fname",
        verified: { displayName: "fname", fullName: "Fake Name" },
      },
    ],
  ]);
  const people = vi.fn(async () => ({
    people: [fake, other],
    hasMore: false,
  }));
  const session = {
    directMessages: { people },
    profiles: { snapshot: () => shared },
  } as unknown as ComposerSession;
  const signal = new AbortController().signal;
  await fetchMentionDirectoryPage(session, "fake", signal);
  // The complete page for "fake" answers "fake n" without another read.
  const refined = await fetchMentionDirectoryPage(session, "fake n", signal);
  expect(people).toHaveBeenCalledOnce();
  expect(refined.people).toEqual([fake]);
});

it("keeps a person with no profile when a refined query matches their verified username", async () => {
  // Found by their relay-signed head alone, named by it.
  const unprofiled = {
    pubkey: "a".repeat(64),
    name: "Brittney G",
    username: "brittneyg",
    verified: { displayName: "Brittney G", username: "brittneyg" },
  };
  const other = { pubkey: "b".repeat(64), name: "Britt" };
  const people = vi.fn(async () => ({
    people: [unprofiled, other],
    hasMore: false,
  }));
  const session = {
    directMessages: { people },
    profiles: { snapshot: () => new Map() },
  } as unknown as ComposerSession;
  const signal = new AbortController().signal;
  await fetchMentionDirectoryPage(session, "britt", signal);
  const refined = await fetchMentionDirectoryPage(session, "brittneyg", signal);
  expect(people).toHaveBeenCalledOnce();
  expect(refined.people).toEqual([unprofiled]);
});
