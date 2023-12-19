"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Event, Filter, generatePrivateKey, getEventHash, getPublicKey, getSignature, nip19 } from "nostr-tools";

import BackupKeysButtons from "../components/BackupKeysButtons";
import { usePostRelayStore } from "../stores/postRelayStore";
import { useRelayStore } from "../stores/relayStore";
import { useUserProfileStore } from "../stores/userProfileStore";
import type { Profile } from "../types";

export default function LoginPage() {
  const { setUserProfile, setUserPublicKey, setUserPrivateKey } = useUserProfileStore();
  const { relayUrl, publish, subscribe } = useRelayStore();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [privKey, setPrivKey] = useState("");
  const [pubKey, setPubKey] = useState("");
  const [userProvidedPrivateKey, setUserProvidedPrivateKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { getActivePostRelayURLs } = usePostRelayStore();

  enum SignupStep {
    Start,
    PrivateKeyLogin,
    CreateAccount,
    SavePrivateKey,
  }
  const [signupStep, setSignupStep] = useState<SignupStep>(SignupStep.Start);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const createKeypair = (): [string, string] => {
    const privateKey = generatePrivateKey();
    const publicKey = getPublicKey(privateKey);
    return [publicKey, privateKey];
  };

  const handleCreateAccount = async (e: any) => {
    e.preventDefault();

    setUserPrivateKey(privKey);
    // TODO: Remove this when NoComment is replaced with something else
    // https://github.com/Resolvr-io/resolvr.io/issues/66
    localStorage.setItem("nostrkey", privKey);
    setUserPublicKey(pubKey);
    const profile: Profile = {
      relay: relayUrl || "",
      publicKey: pubKey,
      name: name || "",
      about: "",
      picture: "",
      nip05: "",
      website: "",
      lud06: "",
      lud16: "",
      banner: "",
    };

    let event: Event = {
      id: "",
      sig: "",
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify({
        name,
      }),
      pubkey: pubKey,
    };
    event.id = getEventHash(event);
    event.sig = getSignature(event, privKey);
    setUserProfile(relayUrl, profile);

    const onSeen = () => {
      router.push("/");
    };

    publish(getActivePostRelayURLs(), event, onSeen);
  };

  const handleCancel = (e: any) => {
    e.preventDefault();
    router.push("/");
  };

  const handleOnChange = (e: any) => {
    setName(e.target.value);
  };

  const handleLoginWithNostr = async (e: any) => {
    e.preventDefault();
    if (typeof nostr !== "undefined") {
      const publicKey: string = await nostr.getPublicKey();
      setUserPublicKey(publicKey);
      router.push("/");
    } else {
      setErrorMessage("No extension found");
    }
  };

  const handleLoginWithPrivateKey = (e: any) => {
    e.preventDefault();
    clearState();
    setSignupStep(SignupStep.PrivateKeyLogin);
  };

  const handleDerivePubkeyFromPrivkey = (e: any) => {
    e.preventDefault();
    if (!userProvidedPrivateKey.startsWith("nsec")) {
      setErrorMessage("Please provide your private key that starts with nsec1");
      return;
    }
    const decodedPrivateKey: any = nip19.decode(userProvidedPrivateKey).data;
    const publicKey = getPublicKey(decodedPrivateKey);

    const userFilter: Filter = {
      kinds: [0],
      authors: [publicKey],
    };

    const onEvent = (_: Event) => {
      setUserPublicKey(publicKey);
      setUserPrivateKey(decodedPrivateKey);
      // TODO: Remove this when NoComment is replaced with something else
      // https://github.com/Resolvr-io/resolvr.io/issues/66
      localStorage.setItem("nostrkey", decodedPrivateKey);
    };

    const onEOSE = () => {
      router.push("/");
    };

    subscribe([relayUrl], userFilter, onEvent, onEOSE);
  };

  const handleBack = (e: any) => {
    e.preventDefault();
    setSignupStep(SignupStep.Start);
    clearState();
  };

  const handleGenerateKeys = (e: any) => {
    e.preventDefault();
    const [publicKey, privateKey] = createKeypair();
    setPubKey(publicKey);
    setPrivKey(privateKey);

    setSignupStep(SignupStep.SavePrivateKey);
  };

  function clearState() {
    setErrorMessage("");
    setName("");
    setPrivKey("");
    setPubKey("");
    setUserProvidedPrivateKey("");
  }

  const copyTextToClipboard = async (text: string) => {
    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
    } else {
      document.execCommand("copy", true, text);
    }
  };

  return (
    mounted && (
      <>
        <div className="h-screen flex-col items-center p-4">
          <div className="flex flex-col gap-10">
            <div className="m-auto w-full max-w-sm">
              <svg width="121" height="120" viewBox="0 0 121 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M71.2193 49.2215C71.2193 53.5398 68.7618 57.2841 65.169 59.1321L70.86 82.2754H49.3031L54.9941 59.1321C51.4014 57.2841 48.9438 53.5398 48.9438 49.2215C48.9438 43.0703 53.9304 38.0838 60.0816 38.0838C66.2328 38.0838 71.2193 43.0703 71.2193 49.2215Z"
                  fill="white"
                  fill-opacity="0.05"
                  style={{ mixBlendMode: "difference" }}
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M57.2073 0L53.0369 15.6391C31.5803 19.0195 15.1714 37.5935 15.1714 60C15.1714 74.1791 21.7423 86.8234 32.0052 95.0541L25.5905 120H39.2432L43.9139 102.036L43.3292 101.682C46.4368 102.932 49.7164 103.844 53.1227 104.374L49.3031 120H62.9558L67.1262 104.361C88.5829 100.98 104.992 82.4065 104.992 60C104.992 45.8215 98.4214 33.1776 88.1593 24.947L94.7747 0H80.9199L76.2669 18.0948C73.2262 16.9196 70.0256 16.0658 66.7066 15.5751L70.86 0H57.2073ZM60.0816 91.2492C42.8231 91.2492 28.8323 77.2585 28.8323 60C28.8323 42.7415 42.8231 28.7508 60.0816 28.7508C77.34 28.7508 91.3308 42.7415 91.3308 60C91.3308 77.2585 77.34 91.2492 60.0816 91.2492Z"
                  fill="white"
                  fill-opacity="0.05"
                  style={{ mixBlendMode: "difference" }}
                />
              </svg>
            </div>

            {signupStep === SignupStep.Start && (
              <div className="container m-auto flex w-full max-w-sm flex-col gap-10">
                <h1 className="text-5xl dark:text-white">Get Started</h1>
                <div className="flex flex-col items-start justify-center gap-4">
                  <h3 className="font-bold dark:text-white">I have a nostr account</h3>
                  <p className="opacity-90 dark:text-white">
                    For premium security, we recommend you login with your 
                    {" "}
                    <a href="https://chromewebstore.google.com/detail/alby-bitcoin-wallet-for-l/iokeahhehimjnekafflcihljlcjccdbe" target="_blank" className="text-indigo-600">Alby</a> or {" "}
                    <a href="https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp" target="_blank" className="text-indigo-600">Nos02x</a> extension
                  </p>
                  <div className="flex w-full flex-col gap-2">
                    <button
                      className="w-full rounded-3xl bg-indigo-500 px-2 py-4 text-sm font-medium text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      onClick={handleLoginWithNostr}
                    >
                      Login with nostr extension
                    </button>
                    {errorMessage && <span className="text-sm text-yellow-600 dark:text-yellow-500">{errorMessage}</span>}
                  </div>
                  <button
                    className="w-full rounded-3xl bg-gray-600 px-2 py-4 text-sm font-medium text-white hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
                    onClick={handleLoginWithPrivateKey}
                  >
                    Login with Private key
                  </button>
                </div>
                <div className="flex flex-col items-start justify-center gap-4">
                  <h3 className="font-bold dark:text-white">I don&apos;t have a nostr account</h3>
                  <p className="opacity-90 dark:text-white">Let&apos;s create one in a minute!</p>
                  <button
                    className="w-full rounded-3xl bg-gray-600 px-2 py-4 text-sm font-medium text-white hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
                    onClick={() => setSignupStep(SignupStep.CreateAccount)}
                  >
                    Create Account
                  </button>
                  <button
                    className="w-full px-2 py-4 text-sm font-medium hover:text-gray-700 dark:text-white dark:hover:opacity-90 "
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {signupStep === SignupStep.PrivateKeyLogin && (
              <div className="container m-auto flex w-full max-w-sm flex-col gap-10">
                <h1 className="text-5xl dark:text-white">Private key login</h1>
                <p className="dark:text-white">Enter your private key to continue (nsec1...)</p>
                <div className="flex w-full flex-col gap-4">
                  <input
                    type="password"
                    spellCheck="false"
                    value={userProvidedPrivateKey}
                    // style={{ color: "transparent", textShadow: "0 0 6px rgba(255,255,255,0.9)" }}
                    onChange={(e: any) => {
                      setUserProvidedPrivateKey(e.target.value);
                    }}
                    className="transparent text-shadow w-full rounded border border-gray-300 p-2 dark:border-darkBorder dark:bg-gray-600 dark:text-gray-100 "
                  />
                  <div className="flex w-full flex-col gap-2">
                    <button
                      className="rounded-3xl bg-indigo-500 px-2 py-4 text-sm font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      onClick={handleDerivePubkeyFromPrivkey}
                    >
                      Continue
                    </button>
                    {errorMessage && <span className="text-sm text-yellow-600 dark:text-yellow-500">{errorMessage}</span>}
                  </div>
                  <button
                    className=" px-2 py-4 text-sm font-medium hover:text-gray-700 dark:text-white dark:hover:opacity-90 "
                    onClick={handleBack}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {signupStep === SignupStep.CreateAccount && (
              <div className="container m-auto flex w-full max-w-sm flex-col gap-10">
                <h1 className="text-5xl dark:text-white">Enter your name</h1>
                <div className="flex w-full flex-col gap-4">
                  <div>
                    <p className="dark:text-white">What should we call you? You can always change this later</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter name here"
                    value={name}
                    onChange={handleOnChange}
                    className="w-full rounded border border-gray-300 p-2 dark:border-darkBorder dark:bg-gray-600 dark:text-gray-100"
                  />
                  <button
                    className="rounded-3xl bg-indigo-500 px-2 py-4 text-sm font-medium text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    onClick={handleGenerateKeys}
                  >
                    Continue
                  </button>
                  <button
                    className=" px-2 py-4 text-sm font-medium hover:text-gray-700 dark:text-white dark:hover:opacity-90 "
                    onClick={handleBack}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {signupStep === SignupStep.SavePrivateKey && (
              <div className="m-auto flex w-full max-w-2xl flex-col items-start justify-center gap-10">
                <div className="w-full">
                  <h1 className="text-5xl dark:text-white">Your Keys</h1>
                </div>
                <div className="flex w-full flex-col gap-4">
                  <h2 className="opacity-90 dark:text-white">
                    Copy and Save your private key - without it, you will lose access to your account!
                  </h2>
                  <BackupKeysButtons publicKey={pubKey} privateKey={privKey}></BackupKeysButtons>
                  <div className="flex w-full flex-col items-center justify-center gap-4">
                    <button
                      className="w-full max-w-sm rounded-3xl bg-indigo-500 px-2 py-4 text-sm font-medium text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      onClick={handleCreateAccount}
                    >
                      Continue
                    </button>
                    <button
                      className="w-full max-w-sm px-2 py-4 text-sm font-medium hover:text-gray-700 dark:text-white dark:hover:opacity-90 "
                      onClick={() => {
                        setSignupStep(SignupStep.CreateAccount);
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  );
}
