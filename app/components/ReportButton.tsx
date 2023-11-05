import { Fragment, useEffect, useRef, useState } from "react";

import { LightningCircleIcon, LightningIcon } from "@bitcoin-design/bitcoin-icons-react/filled";
import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { CheckIcon, FlagIcon } from "@heroicons/react/24/solid";
import { type Event, EventTemplate, Filter, UnsignedEvent, getEventHash, getSignature, nip57 } from "nostr-tools";

import { RESOLVR_NAMESPACE, ReportType } from "../lib/constants";
import { fetchInvoice, getZapEndpoint, getZapRecieptFromRelay } from "../lib/nostr";
import { getTagValues, removeTag } from "../lib/utils";
import { useBountyEventStore } from "../stores/eventStore";
import { useRelayStore } from "../stores/relayStore";
import { useUserProfileStore } from "../stores/userProfileStore";

interface Props {
  event: Event;
  label?: string;
}

export default function ReportButton({ event, label }: Props) {
  let [isOpen, setIsOpen] = useState(false);
  const [isZapConfirmationOpen, setIsZapConfirmationOpen] = useState(false);
  const [isZapSuccess, setIsZapSuccess] = useState(true);
  const [tipMessage, setZapMessage] = useState<string>();
  const [paymentHash, setPaymentHash] = useState();
  const [tippedAmount, setZappedAmount] = useState<any>();

  const [callCount, setCallCount] = useState(0); // State to track the number of calls
  const intervalRef = useRef<number | undefined>(); // Explicitly typing intervalRef

  const { cachedBountyEvent } = useBountyEventStore();
  const { relayUrl, publish } = useRelayStore();
  const { userPublicKey, userPrivateKey } = useUserProfileStore();

  const [reportType, setReportType] = useState<ReportType>(ReportType.Spam);

  useEffect(() => {}, []);

  const report = async (e: any) => {
    e.preventDefault();

    let tags: string[][] = [];

    tags.push(["p", event.pubkey]);
    tags.push(["e", event.id, reportType]);
    tags.push(["l", reportType, RESOLVR_NAMESPACE]);
    tags.push(["L", RESOLVR_NAMESPACE]);

    let reportEvent: Event = {
      id: "",
      sig: "",
      kind: 1984,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: "",
      pubkey: userPublicKey,
    };

    reportEvent.id = getEventHash(reportEvent);
    if (userPrivateKey) {
      reportEvent.sig = getSignature(reportEvent, userPrivateKey);
    } else {
      reportEvent = await window.nostr.signEvent(reportEvent);
    }

    const onSeen = () => {
      setIsOpen(false);
    };

    publish([relayUrl], reportEvent, onSeen);
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        className="flex items-center gap-2 rounded-lg bg-yellow-500 p-2 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:text-white hover:dark:bg-yellow-500"
      >
        <FlagIcon className="h-5 w-5" />
        {label && <span>{label}</span>}
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div>
                    <Dialog.Title as="h3" className="mb-2 text-lg font-medium leading-6 text-gray-900">
                      Report Bounty
                    </Dialog.Title>
                    <Dialog.Description className="text-sm" as="p">
                      Choose a reason for reporting this bounty
                    </Dialog.Description>
                  </div>
                  <RadioGroup className="my-6" value={reportType} onChange={setReportType}>
                    <RadioGroup.Label className="sr-only">Server size</RadioGroup.Label>
                    <div className="space-y-2">
                      {(Object.keys(ReportType) as Array<keyof typeof ReportType>).map((type) => (
                        <RadioGroup.Option
                          key={type}
                          value={ReportType[type]}
                          className={({ active, checked }) =>
                            `${active ? "ring-2 ring-white/60 ring-offset-2 ring-offset-sky-300" : ""}
                  ${checked ? "bg-indigo-500 text-white" : "bg-white"}
                    relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none`
                          }
                        >
                          {({ active, checked }) => (
                            <>
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <div className="text-sm">
                                    <RadioGroup.Label as="p" className={`font-medium  ${checked ? "text-white" : "text-gray-900"}`}>
                                      {type}
                                    </RadioGroup.Label>
                                    {/* <RadioGroup.Description as="span" className={`inline ${checked ? "text-sky-100" : "text-gray-500"}`}>
                                    <span>plan.ram/ plan.cpus</span> <span aria-hidden="true">&middot;</span> <span>plan.disk</span>
                                  </RadioGroup.Description> */}
                                  </div>
                                </div>
                                {checked && (
                                  <div className="shrink-0 text-white">
                                    <CheckIcon className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </RadioGroup.Option>
                      ))}
                    </div>
                  </RadioGroup>
                  <div className="flex flex-row gap-4">
                    <button
                      onClick={report}
                      className="flex cursor-pointer items-center justify-center rounded-lg bg-red-300/10 p-2 text-sm text-red-500 hover:bg-red-400/20"
                    >
                      Report
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex cursor-pointer items-center justify-center rounded-lg bg-indigo-300/10 p-2 text-sm  text-indigo-500 hover:bg-indigo-400/20"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
