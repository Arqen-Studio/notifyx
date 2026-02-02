"use client";

import { useState, useEffect } from "react";
import { Eye, EyeClosed } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/button";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center bg-[#FFFFFF] py-10 min-h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex items-center justify-center bg-[#FFFFFF] py-10 min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <Card className="w-full md:max-w-[500px] mx-auto rounded-[26px] border border-[#E7E7E7] p-6 flex-col items-center justify-center">
        <CardHeader className="text-center mb-3">
          <CardTitle className="sub-heading">Login</CardTitle>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 flex flex-col items-center">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="bg-[#FBFBFA] rounded-[14px] !text-[16px] h-[50px] border border-[#FBFBFA] placeholder:!text-[#9D9E98]"
            />

            <div className="relative w-full">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="bg-[#FBFBFA] rounded-[14px] !text-[18px] h-[60px] border border-[#FBFBFA] placeholder:!text-[#9D9E98] pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-[#5F6057]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeClosed className="h-5 w-5" />
                )}
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center space-y-4 mt-2">
            {error && (
              <div className="w-full text-center text-red-600 text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-20 h-[50px] font-bricolage font-extrabold rounded-full text-[#FFFFFF] text-[20px] custom-box-shadow hover:opacity-90 bg-[#4f064f] hover:bg-[#3d053d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="flex items-center gap-3 text-[#9D9E98] w-full md:w-auto">
              <hr className="flex-1 border-t border-[#E6E6E1]" />
              <span className="text-[18px] leading-[25px]">or</span>
              <hr className="flex-1 border-t border-[#E6E6E1]" />
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full px-10 h-[60px] rounded-full bg-[#F6F6F3] border-[#E6E6E1] text-[25px] text-[#5F6057] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="/svg/google-icon-logo.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Sign in with Google
            </Button>
            <p className="text-center text-[18px] leading-[25px]">
              New user?{" "}
              <Link
                href="/signup"
                className="text-[18px] leading-[25px] italic hover:text-[#4f064f] font-medium underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}
