"use client";

import { useState } from "react";
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

export default function SignUpPage() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    surname: "",
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (phone: string) => {
    setForm((prev) => ({ ...prev, mobile: phone }));
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.surname || !form.password) {
      alert("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    console.log("Form data:", form);
    alert(
      `Sign up successful!\n\nEmail: ${form.email}\nName: ${form.name} ${form.surname}\nMobile: ${form.mobile || "Not provided"}`,
    );

    setForm({
      email: "",
      name: "",
      surname: "",
      mobile: "",
      password: "",
    });
  };

  return (
    <div className="flex items-center justify-center bg-[#FFFFFF] py-10 min-h-screen">
      <Card className="w-full md:max-w-[500px] rounded-[26px] border border-[#E7E7E7] p-6 flex-col items-center justify-center">
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
            <Button
              type="submit"
              className="w-full md:w-auto px-20 h-[50px] font-bricolage font-extrabold rounded-full text-[#FFFFFF] text-[20px] custom-box-shadow hover:opacity-90"
            >
              Sign Up
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
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
