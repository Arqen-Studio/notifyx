"use client";
import Button from "@/components/button";
import { useRouter } from "next/navigation";
import { Bell, Calendar, Clock, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Smart Reminders",
      description: "Never miss an important deadline with intelligent reminder notifications",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Easy Scheduling",
      description: "Schedule your tasks and reminders with an intuitive calendar interface",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Time Management",
      description: "Track your deadlines and manage your time more effectively",
    },
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      title: "Stay Organized",
      description: "Keep all your tasks and reminders in one place, organized and accessible",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#F6F6F3] border border-[#E6E6E1]">
              <Sparkles className="w-4 h-4 text-[#5F6057]" />
              <span className="text-sm text-[#5F6057] font-medium">
                Your Personal Reminder Assistant
              </span>
            </div>
            <h1 className="font-bricolage text-5xl md:text-7xl font-extrabold text-[#171717] mb-6 leading-tight">
              Never Miss
              <br />
              <span className="text-[#5F6057]">What Matters</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#5F6057] mb-10 max-w-2xl mx-auto leading-relaxed">
              Schedule your reminders easily and stay on top of all your important tasks. 
              Notifyx helps you manage your time and never forget anything again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => router.push("/signup")}
                className="px-10 h-[60px] font-bricolage font-extrabold rounded-full text-[#FFFFFF] text-[20px] custom-box-shadow hover:opacity-90 bg-[#4f064f] hover:bg-[#3d053d]"
              >
                Get Started Free
              </Button>
              <Link href="/login">
                <Button
                  className="px-10 h-[60px] font-bricolage font-extrabold rounded-full text-[20px] bg-[#F6F6F3] border-[#E6E6E1] text-[#5F6057] hover:bg-[#E6E6E1]"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#FBFBFA] rounded-[20px] p-6 border border-[#E7E7E7] hover:border-[#5F6057] transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-14 h-14 rounded-[14px] bg-[#F6F6F3] border border-[#E6E6E1] flex items-center justify-center text-[#5F6057] mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bricolage text-xl font-bold text-[#171717] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#5F6057] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="bg-gradient-to-br from-[#FBFBFA] to-[#F6F6F3] rounded-[26px] p-12 border border-[#E7E7E7]">
              <h2 className="font-bricolage text-3xl md:text-4xl font-extrabold text-[#171717] mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-[#5F6057] text-lg mb-8 max-w-xl mx-auto">
                Join thousands of users who are already managing their reminders with Notifyx
              </p>
              <Button
                onClick={() => router.push("/signup")}
                className="px-12 h-[60px] font-bricolage font-extrabold rounded-full text-[#FFFFFF] text-[20px] custom-box-shadow hover:opacity-90 bg-[#4f064f] hover:bg-[#3d053d]"
              >
                Create Your Account
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
