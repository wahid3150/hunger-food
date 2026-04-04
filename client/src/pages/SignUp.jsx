import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  HiMiniEye,
  HiMiniEyeSlash,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineUser,
} from "react-icons/hi2";
import axios from "axios";
import toast from "react-hot-toast";
import { serverUrl } from "../App";

const roles = ["user", "owner", "deliveryBoy"];

const SignUp = () => {
  const [selectedRole, setSelectedRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          fullName,
          email,
          password,
          mobile,
          role: selectedRole,
        },
        { withCredentials: true },
      );
      toast.success(result.data.message || "Account created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4 py-4">
      <div className="mx-auto w-full max-w-[390px] rounded-[24px] border border-[#f1e5df] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#ff5a36]">
          Hunger food
        </h1>
        <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-slate-500">
          Create your account to get started with delicious food deliveries
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSignUp}>
          <div>
            <label
              htmlFor="fullName"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Full Name
            </label>
            <div className="relative">
              <HiOutlineUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
              <input
                id="fullName"
                type="text"
                placeholder="Enter your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Email
            </label>
            <div className="relative">
              <HiOutlineEnvelope className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="mobile"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Mobile
            </label>
            <div className="relative">
              <HiOutlinePhone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
              <input
                id="mobile"
                type="tel"
                placeholder="Enter your Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400 transition hover:text-[#ff5a36]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <HiMiniEyeSlash /> : <HiMiniEye />}
              </button>
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-700">
              Role
            </span>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => {
                const isActive = selectedRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition ${
                      isActive
                        ? "border-[#ff5a36] bg-[#ff5a36] text-white"
                        : "border-[#d8b9ae] bg-white text-[#c86a4d] hover:border-[#ff5a36]"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#ff5a36] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#f24d28]"
          >
            Sign Up
          </button>

          <button
            type="button"
            onClick={() => toast("Google signup is not connected yet")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-[#ff5a36]/50 hover:bg-[#fff7f3]"
          >
            <FcGoogle className="text-base" />
            Sign up with Google
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-700">
          Already have an account ?{" "}
          <Link to="/signin" className="font-medium text-[#c86a4d]">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
