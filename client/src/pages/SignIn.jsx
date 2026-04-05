import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  HiMiniEye,
  HiMiniEyeSlash,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import axios from "axios";
import toast from "react-hot-toast";
import { serverUrl } from "../App";
import { auth } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0] ||
  error.message ||
  fallbackMessage;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Please provide a valid email address";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required";
    } else if (password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        {
          email,
          password,
        },
        { withCredentials: true },
      );

      toast.success(result.data.message || "Signed in successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Signin failed"));
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const googlePayload = {
        email: googleUser.email || "",
        role: "user",
      };

      if (googleUser.displayName) {
        googlePayload.fullName = googleUser.displayName;
      }

      if (googleUser.phoneNumber) {
        googlePayload.mobile = googleUser.phoneNumber.replace(/[^\d+]/g, "");
      }

      const response = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        googlePayload,
        { withCredentials: true },
      );

      if (response.data.requiresProfileCompletion) {
        toast.error("Please complete your profile from the signup page first.");
        return;
      }

      toast.success("Signed in with Google successfully");
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error(getErrorMessage(error, "Google signin failed"));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4 py-4">
      <div className="mx-auto w-full max-w-[390px] rounded-[24px] border border-[#f1e5df] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#ff5a36]">
          Hunger food
        </h1>
        <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-slate-500">
          Sign in to continue with your delicious food deliveries
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSignIn}>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <HiOutlineEnvelope className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                autoComplete="email"
                className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:ring-2 focus:ring-[#ff5a36]/10 ${
                  errors.email
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-200 focus:border-[#ff5a36]"
                }`}
              />
            </div>
            {errors.email ? (
              <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-medium text-[#c86a4d] transition hover:text-[#ff5a36]"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                autoComplete="current-password"
                className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:ring-2 focus:ring-[#ff5a36]/10 ${
                  errors.password
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-200 focus:border-[#ff5a36]"
                }`}
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
            {errors.password ? (
              <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#ff5a36] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#f24d28]"
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-[#ff5a36]/50 hover:bg-[#fff7f3]"
          >
            <FcGoogle className="text-base" />
            {isGoogleLoading ? "Connecting Google..." : "Sign in with Google"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-700">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-[#c86a4d]">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
