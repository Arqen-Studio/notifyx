"use client";
import Button from "@/components/button";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className=" flex min-h-screen bg-background">
      {/* <div className="w-3/4 min-h-screen bg-[#cf08cf55]"> */}
      {/* <div className="absolute inset- bg-[#982598] rounded-r-[70%] clip-wave-left"></div> */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-background">
        <h1 className="font-bricolage text-black text-5xl font-bold mb-4 text-center">
          Welcome to Reminder App
        </h1>
        <p className="text-lg text-background/80 text-center">
          Schedule your reminders easily and never miss anything!
        </p>
        <Button onClick={() => router.push("/signup")}>Get Started</Button>
      </div>
      {/* </div> */}
    </div>
  );
}
