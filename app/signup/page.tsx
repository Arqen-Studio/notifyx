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
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { Button } from "@/components/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ApiResponse, SignupResponse, ApiError } from "@/types/api";

export default function SignUpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    name: "",
    surname: "",
    mobile: "",
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

  const handlePhoneChange = (phone: string) => {
    setForm((prev) => ({ ...prev, mobile: phone }));
    setError(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup form submitted", form);
    setError(null);
    setLoading(true);

    try {
      const requestBody = {
        email: form.email,
        name: form.name,
        surname: form.surname,
        mobile: form.mobile || undefined,
        password: form.password,
      };
      
      console.log("Sending signup request:", { ...requestBody, password: "***" });
      
      const response = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Signup response status:", response.status);

      if (!response.ok) {
        let errorMessage = "An error occurred. Please try again.";
        
        if (response.status === 409) {
          errorMessage = "This email is already registered. Please use a different email or try logging in.";
        }
        
        try {
          const text = await response.text();
          console.log("Raw error response text:", text);
          
          if (text && text.trim().length > 0) {
            try {
              const errorData = JSON.parse(text) as ApiError;
              console.error("Signup error response:", errorData);
              
              if (errorData?.error?.message) {
                errorMessage = errorData.error.message;
              }
              
              if (errorData?.error?.details && typeof errorData.error.details === "object") {
                const details = errorData.error.details;
                if (details.email && typeof details.email === "string") {
                  errorMessage = details.email;
                } else if (details.field && typeof details.field === "string") {
                  errorMessage = details.field;
                } else {
                  const firstError = Object.values(details)[0];
                  if (typeof firstError === "string") {
                    errorMessage = firstError;
                  }
                }
              }
            } catch (jsonParseError) {
              console.error("Failed to parse JSON from error response:", jsonParseError);
              if (text.length < 200) {
                errorMessage = text;
              }
            }
          }
        } catch (readError) {
          console.error("Failed to read error response:", readError);
          if (response.status === 409) {
            errorMessage = "This email is already registered. Please use a different email or try logging in.";
          } else {
            errorMessage = `Error ${response.status}: ${response.statusText || "Network error"}`;
          }
        }
        
        console.log("Final error message:", errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Signup success:", data);
      const successData = data as ApiResponse<SignupResponse>;
      
      router.push("/login?signup=success");
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#FFFFFF] py-10 min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <Card className="w-full md:max-w-[500px] mx-auto rounded-[26px] border border-[#E7E7E7] p-6 flex-col items-center justify-center">
        <CardHeader className="text-center mb-3">
          <CardTitle className="sub-heading">Sign up</CardTitle>
        </CardHeader>

        <form onSubmit={handleSignUp}>
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

            <div className="w-full flex gap-6 justify-between">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
                className="bg-[#FBFBFA] rounded-[14px] !text-[16px] h-[50px] border border-[#FBFBFA] placeholder:!text-[#9D9E98]"
              />
              <Input
                id="surname"
                name="surname"
                type="text"
                placeholder="Surname"
                value={form.surname}
                onChange={handleChange}
                required
                className="bg-[#FBFBFA] rounded-[14px] !text-[16px] h-[50px] border border-[#FBFBFA] placeholder:!text-[#9D9E98]"
              />
            </div>

            <div className="w-full">
              <PhoneInput
                defaultCountry="it"
                value={form.mobile}
                onChange={handlePhoneChange}
                placeholder="Mobile number"
                className="w-full !rounded-[14px] !border !border-[#E6E6E1] !bg-[#FBFBFA]"
                inputClassName="!h-[50px] !text-[16px] !bg-[#FBFBFA] !border-none placeholder:!text-[#9D9E98]"
              />
            </div>

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
              <div className="w-full text-center text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-20 h-[50px] font-bricolage font-extrabold rounded-full text-[#FFFFFF] text-[20px] custom-box-shadow hover:opacity-90 bg-[#4f064f] hover:bg-[#3d053d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>

            <div className="flex items-center gap-3 text-[#9D9E98] w-full md:w-auto">
              <hr className="flex-1 border-t border-[#E6E6E1]" />
              <span className="text-[18px] leading-[25px]">or</span>
              <hr className="flex-1 border-t border-[#E6E6E1]" />
            </div>

            <Button
              type="button"
              className="w-full px-10 h-[60px] rounded-full bg-[#F6F6F3] border-[#E6E6E1] text-[25px] text-[#5F6057] flex items-center justify-center gap-2"
            >
              <img
                src="/svg/google-icon-logo.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Sign in with Google
            </Button>
            <p className="text-center text-[18px] leading-[25px]">
              Already have account?{" "}
              <Link
                href="/login"
                className="text-[18px] leading-[25px] italic hover:text-[#4f064f] font-medium underline"
              >
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}
