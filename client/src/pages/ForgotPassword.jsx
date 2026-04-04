import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiMiniEye,
  HiMiniEyeSlash,
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlineKey,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { serverUrl } from "../App";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("sendOtp");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoadingAction("sendOtp");

    try {
      const result = await axios.post(`${serverUrl}/api/auth/send-otp`, {
        email,
      });

      setStep("verifyOtp");
      toast.success(result.data.message || "OTP sent successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoadingAction("");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoadingAction("verifyOtp");

    try {
      const result = await axios.post(`${serverUrl}/api/auth/verify-otp`, {
        email,
        otp,
      });

      setStep("resetPassword");
      toast.success(result.data.message || "OTP verified successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setLoadingAction("");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoadingAction("resetPassword");

    try {
      const result = await axios.post(`${serverUrl}/api/auth/reset-password`, {
        email,
        newPassword,
        confirmPassword,
      });

      toast.success(result.data.message || "Password reset successfully");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("sendOtp");
      setTimeout(() => {
        navigate("/signin");
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4 py-4">
      <div className="mx-auto w-full max-w-[390px] rounded-[24px] border border-[#f1e5df] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#ff5a36]">
          Hunger food
        </h1>
        <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-slate-500">
          Reset your password securely with email OTP verification
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div
            className={`rounded-lg border px-2 py-2 text-center text-[11px] font-semibold ${
              step === "sendOtp"
                ? "border-[#ff5a36] bg-[#fff1eb] text-[#ff5a36]"
                : "border-slate-200 text-slate-500"
            }`}
          >
            Send OTP
          </div>
          <div
            className={`rounded-lg border px-2 py-2 text-center text-[11px] font-semibold ${
              step === "verifyOtp"
                ? "border-[#ff5a36] bg-[#fff1eb] text-[#ff5a36]"
                : "border-slate-200 text-slate-500"
            }`}
          >
            Verify OTP
          </div>
          <div
            className={`rounded-lg border px-2 py-2 text-center text-[11px] font-semibold ${
              step === "resetPassword"
                ? "border-[#ff5a36] bg-[#fff1eb] text-[#ff5a36]"
                : "border-slate-200 text-slate-500"
            }`}
          >
            Reset Password
          </div>
        </div>

        <form className="mt-4 space-y-3">
          {step === "sendOtp" ? (
            <>
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

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loadingAction === "sendOtp" || !email}
                className="w-full rounded-lg bg-[#ff5a36] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#f24d28] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "sendOtp" ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : null}

          {step === "verifyOtp" ? (
            <>
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
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13px] text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  OTP Code
                </label>
                <div className="relative">
                  <HiOutlineKey className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
                  <input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loadingAction === "verifyOtp" || !otp}
                className="w-full rounded-lg border border-[#ff5a36] bg-white py-2.5 text-[13px] font-semibold text-[#ff5a36] transition hover:bg-[#fff7f3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "verifyOtp" ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtp("");
                  setStep("sendOtp");
                }}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Change Email
              </button>
            </>
          ) : null}

          {step === "resetPassword" ? (
            <>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <div className="flex items-center gap-2">
                  <HiOutlineCheckBadge className="text-sm" />
                  OTP verified. You can now set a new password.
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
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13px] text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  New Password
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400 transition hover:text-[#ff5a36]"
                    aria-label={
                      showNewPassword ? "Hide new password" : "Show new password"
                    }
                  >
                    {showNewPassword ? <HiMiniEyeSlash /> : <HiMiniEye />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400 transition hover:text-[#ff5a36]"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <HiMiniEyeSlash />
                    ) : (
                      <HiMiniEye />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={
                  loadingAction === "resetPassword" ||
                  !newPassword ||
                  !confirmPassword
                }
                className="w-full rounded-lg bg-[#ff5a36] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#f24d28] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "resetPassword"
                  ? "Resetting..."
                  : "Reset Password"}
              </button>
            </>
          ) : null}
        </form>

        <p className="mt-4 text-center text-xs text-slate-700">
          Remembered your password?{" "}
          <Link to="/signin" className="font-medium text-[#c86a4d]">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
