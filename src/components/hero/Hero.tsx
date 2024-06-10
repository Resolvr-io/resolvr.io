import Image from "next/image";

import { Button } from "../ui/button";
import HeroImage from "./HeroImage.svg";

export default function Hero() {
  return (
    <div className="relative z-auto flex h-full min-h-[261px] w-full flex-col p-4 md:p-8">
      <div className="flex w-full flex-col md:max-w-96">
        <div className="flex w-full flex-row gap-x-2">
          <Button>Get Started</Button>
          <Button variant="secondary">Intro To Fundsolvr</Button>
        </div>
        <div className="mt-[81px] flex flex-col gap-y-2 text-white">
          <h3 className="text-2xl font-semibold">
            How Open Source Should Work
          </h3>
          <span className="text-sm">
            Get paid to contribute or fund open source projects and builders
            with Sats.
          </span>
        </div>
      </div>
      <Image
        alt="Hero Image"
        src={HeroImage as string}
        quality={100}
        fill
        sizes="100vw"
        className="rounded-md"
        style={{
          objectFit: "cover",
          zIndex: "-1",
        }}
      />
    </div>
  );
}
