"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import useAuth from "~/hooks/useAuth";
import { TAGS } from "~/lib/constants";
import { cn, createIdentifier } from "~/lib/utils";
import { revalidateCachedTag } from "~/server";
import { useRelayStore } from "~/store/relay-store";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { nip19, type Event, type EventTemplate } from "nostr-tools";
import { useForm } from "react-hook-form";
import Markdown from "react-markdown";
import { createNaddr, finishEvent, usePublish } from "react-nostr";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  title: z
    .string()
    .min(4, { message: "title must be at least 4 characters." })
    .max(80, { message: "title must be under 80 characters." }),
  description: z.string().min(1, { message: "description is required." }),
  tag: z.string().min(1, { message: "you must select a tag" }),
  reward: z.coerce
    .number()
    .int("reward must be an integer.")
    .positive("reward must be greater than 0.")
    .lt(1000000000, { message: "reward must be less than 1,000,000,000." }),
  shouldNotify: z.boolean(),
});

export default function CreateBounty() {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // TODO: hold onto form values on page change, clear on submit
    defaultValues: {
      title: "",
      description:
        "## Problem Description\n\n## Acceptance Criteria\n\n## Additional Information\n\n",
      tag: "",
      reward: 0,
      shouldNotify: false,
    },
  });
  const { pubRelays } = useRelayStore();
  const { pubkey, seckey } = useAuth();

  const { publish, status, invalidateKeys } = usePublish({
    relays: pubRelays,
  });

  const router = useRouter();

  async function postSocialNote(bountyEvent: Event) {
    if (!pubkey) {
      toast("No pubkey", {
        description:
          "You don't have a pubkey. Please log in or create an account.",
      });
      return;
    }

    const content = `I just posted a new bounty on Nostr! 
      https://fundsolvr.com/b/${createNaddr(bountyEvent, pubRelays)}
    `;

    const eventTemplate: Event = {
      kind: 1,
      tags: [],
      content: content,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: pubkey,
      id: "",
      sig: "",
    };

    const onErr = (err: Error) => {
      toast("Post note failure", {
        description: "Failed to post your social note!",
      });
      console.log("Post note failure", err);
    };

    const onSuccess = (_: Event) => {
      toast("Post note success", {
        description: "Successfully posted your social note!",
      });
    };

    try {
      const event = await finishEvent(eventTemplate, seckey, onErr);
      await publish(event, onSuccess);
    } catch (e) {
      return e;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!pubkey) {
      toast("No pubkey", {
        description:
          "You don't have a pubkey. Please log in or create an account.",
      });
      return;
    }

    const { title, description, tag, reward, shouldNotify } = values;

    const identifier = createIdentifier(title, pubkey);

    const tags = [
      ["d", identifier],
      ["title", title],
      ["s", "open"],
      ["reward", reward.toString()],
      ["c", "BTC"],
      ["t", tag],
    ];

    const eventTemplate: EventTemplate = {
      kind: 30050,
      tags: tags,
      content: description,
      created_at: Math.floor(Date.now() / 1000),
    };

    const event = await finishEvent(eventTemplate, seckey);

    const onSuccess = (_: Event) => {
      void invalidateKeys(["open", "posted"]);
      if (shouldNotify) {
        postSocialNote(_)
          .then((success) => {
            console.log(success);
          })
          .catch((error) => {
            console.log(error);
          });
      }

      router.push("/");
    };

    if (!event) {
      toast("Event not signed", {
        description: "You did not sign the event. Please try again",
      });
      return;
    }

    await publish(event, onSuccess);
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-3xl space-y-12"
        >
          <h1 className="self-start pt-4 text-2xl font-bold">Create Bounty</h1>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <Tabs defaultValue="write">
                  <div className="flex items-center justify-between">
                    <FormLabel>Description</FormLabel>
                    <div className="mr-1 flex items-center">
                      <TabsList className="bg-background">
                        <TabsTrigger
                          className="data-[state=active]:bg-muted"
                          value="write"
                        >
                          Write
                        </TabsTrigger>
                        <TabsTrigger
                          className="data-[state=active]:bg-muted"
                          value="preview"
                        >
                          Preview
                        </TabsTrigger>
                      </TabsList>
                      <a
                        href="https://www.markdownguide.org/basic-syntax/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          className="ml-2 text-muted-foreground hover:cursor-pointer hover:text-accent-foreground"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="m16 15l3-3l-1.05-1.075l-1.2 1.2V9h-1.5v3.125l-1.2-1.2L13 12zM4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm0-2h16V6H4zm0 0V6zm1.5-3H7v-4.5h1v3h1.5v-3h1V15H12v-5q0-.425-.288-.712T11 9H6.5q-.425 0-.712.288T5.5 10z"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <TabsContent value="write">
                    <FormControl>
                      <Textarea
                        // placeholder="Tell us a little bit about yourself"
                        // className="resize-none"
                        className="min-h-[12rem]"
                        {...field}
                      />
                    </FormControl>
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="max-h-[28rem] min-h-[12rem] w-full overflow-y-auto rounded-md border border-input bg-muted/90">
                      <article className="prose prose-sm w-full px-3 py-2 dark:prose-invert">
                        <Markdown>{form.getValues().description}</Markdown>
                      </article>
                    </div>
                  </TabsContent>
                </Tabs>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tag</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "justify-between",
                          !field.value && "bg-muted/90 text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? TAGS.find((tag) => tag === field.value)
                          : "select tag"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="popover-content-width-same-as-its-trigger p-0">
                    <Command className="">
                      <CommandInput placeholder="search tags..." />
                      <CommandEmpty>No tag found.</CommandEmpty>
                      <CommandGroup className="max-h-36 overflow-y-auto">
                        {TAGS.map((tag) => (
                          <CommandItem
                            value={tag}
                            key={tag}
                            onSelect={() => {
                              form.setValue("tag", tag);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                tag === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reward</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Value in sats" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shouldNotify"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border bg-muted/90 p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Post Social Note</FormLabel>
                  <FormDescription>
                    Post a note to let your followers know about your bounty.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {status === "pending" ? (
            <Button disabled>Submitting...</Button>
          ) : (
            <Button type="submit">Create Bounty</Button>
          )}
        </form>
      </Form>
    </div>
  );
}
