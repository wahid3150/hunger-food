import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiCheckCircle, HiRefresh, HiX } from "react-icons/hi";
import { serverUrl } from "../../App";

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

const OtpVerification = ({ orderId, onSuccess, onCancel }) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  const startCooldown = useCallback((seconds = COOLDOWN_SECONDS) => {
    setCooldown(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError("");

    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    // Focus last filled or next empty
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const otpValue = otp.join("");

  const handleVerify = async () => {
    if (otpValue.length !== OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      await axios.patch(
        `${serverUrl}/api/orders/${orderId}/verify-otp`,
        { otp: otpValue },
        { withCredentials: true },
      );
      setSuccess(true);
      toast.success("Delivery confirmed! 🎉");
      setTimeout(() => {
        onSuccess?.();
      }, 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || "OTP verification failed";
      setError(msg);
      toast.error(msg);
      // Clear inputs on wrong OTP
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      await axios.post(
        `${serverUrl}/api/orders/${orderId}/resend-otp`,
        {},
        { withCredentials: true },
      );
      toast.success("OTP resent to customer's email");
      startCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      toast.error(msg);

      // If server returned remaining seconds (429 response)
      const match = msg.match(/(\d+)s/);
      if (match) startCooldown(Number(match[1]));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative rounded-3xl border border-[#ff5a36]/20 bg-gradient-to-br from-white to-[#fff7f3] p-6 shadow-[0_18px_55px_rgba(255,90,54,0.08)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#ff5a36]">
            Delivery Confirmation
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-900">
            Enter OTP from customer
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Ask the customer for the 6-digit OTP sent to their email.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close OTP panel"
          >
            <HiX className="text-xl" />
          </button>
        )}
      </div>

      {/* Success state */}
      {success ? (
        <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <HiCheckCircle className="text-4xl text-emerald-500" />
          </span>
          <p className="text-lg font-black text-slate-800">Order Delivered!</p>
          <p className="text-sm text-slate-500">
            The delivery has been verified successfully.
          </p>
        </div>
      ) : (
        <>
          {/* OTP Inputs */}
          <div
            className="mt-6 flex justify-center gap-2 sm:gap-3"
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`h-12 w-10 rounded-xl border-2 text-center text-lg font-black text-slate-900 outline-none transition sm:h-14 sm:w-12 sm:text-xl ${
                  error
                    ? "border-red-400 bg-red-50 focus:border-red-500"
                    : digit
                      ? "border-[#ff5a36] bg-[#fff7f3]"
                      : "border-slate-200 bg-white focus:border-[#ff5a36]"
                }`}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="mt-3 text-center text-sm font-semibold text-red-500">
              {error}
            </p>
          )}

          {/* Verify button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || otpValue.length !== OTP_LENGTH}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a36] to-[#ff4420] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? (
              <>
                <HiRefresh className="animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <HiCheckCircle /> Confirm Delivery
              </>
            )}
          </button>

          {/* Resend OTP */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Customer didn&apos;t receive the OTP?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className={`font-bold underline-offset-2 transition ${
                  cooldown > 0 || resending
                    ? "cursor-not-allowed text-slate-300"
                    : "text-[#ff5a36] hover:underline"
                }`}
              >
                {resending
                  ? "Resending…"
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend OTP"}
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default OtpVerification;
