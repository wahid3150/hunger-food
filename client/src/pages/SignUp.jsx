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
import { auth } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import AuthButtonLoader from "../components/AuthButtonLoader";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/userSlice";

const roles = ["user", "owner", "deliveryBoy"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pakistaniMobilePattern = /^(?:\+92|92|0)?3[0-9]{9}$/;

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0] ||
  error.message ||
  fallbackMessage;

const SignUp = () => {
  const dispatch = useDispatch();
  const [selectedRole, setSelectedRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCompletingGoogleProfile, setIsCompletingGoogleProfile] = useState(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState("");
  const [errors, setErrors] = useState({});

  const validateSignUpForm = () => {
    const nextErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 3) {
      nextErrors.fullName = "Name must be at least 3 characters long";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Please provide a valid email address";
    }

    if (!mobile.trim()) {
      nextErrors.mobile = "Mobile number is required";
    } else if (!pakistaniMobilePattern.test(mobile.trim())) {
      nextErrors.mobile =
        "Enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required";
    } else if (password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateGoogleProfileForm = () => {
    const nextErrors = {};

    if (!mobile.trim()) {
      nextErrors.mobile = "Mobile number is required";
    } else if (!pakistaniMobilePattern.test(mobile.trim())) {
      nextErrors.mobile =
        "Enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!validateSignUpForm()) {
      return;
    }

    setIsSubmitting(true);

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
      dispatch(setUser(result.data?.user ?? result.data));
      toast.success(result.data.message || "Account created successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Signup failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const googleFullName = googleUser.displayName || fullName;
      const googleEmail = googleUser.email || email;

      setFullName(googleFullName);
      setEmail(googleEmail);
      setMobile("");
      setGoogleAccountEmail(googleEmail);
      setIsCompletingGoogleProfile(true);
      setErrors({});

      toast.success("Google account connected. Complete your profile.");
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error(getErrorMessage(error, "Google signup failed"));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteGoogleProfile = async (e) => {
    e.preventDefault();

    if (!validateGoogleProfileForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        {
          fullName,
          email: googleAccountEmail || email,
          mobile,
          role: selectedRole,
        },
        { withCredentials: true },
      );

      setIsCompletingGoogleProfile(response.data.requiresProfileCompletion);
      if (!response.data.requiresProfileCompletion) {
        dispatch(setUser(response.data?.user ?? response.data));
      }
      toast.success(response.data.message || "Profile completed successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to complete Google profile"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4 py-4">
      <div className="mx-auto w-full max-w-[390px] rounded-[24px] border border-[#f1e5df] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#ff5a36]">
          Hunger food
        </h1>
        <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-slate-500">
          {isCompletingGoogleProfile
            ? "Complete your profile to finish setting up your Google account"
            : "Create your account to get started with delicious food deliveries"}
        </p>

        <form
          className="mt-4 space-y-3"
          onSubmit={isCompletingGoogleProfile ? handleCompleteGoogleProfile : handleSignUp}
        >
          {!isCompletingGoogleProfile && (
            <div>
              <label
              htmlFor="fullName"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
              <div className="relative">
                <HiOutlineUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your Full Name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  autoComplete="name"
                  className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:ring-2 focus:ring-[#ff5a36]/10 ${
                    errors.fullName
                      ? "border-red-400 focus:border-red-400"
                      : "border-slate-200 focus:border-[#ff5a36]"
                  }`}
                />
              </div>
              {errors.fullName ? (
                <p className="mt-1 text-[11px] text-red-500">{errors.fullName}</p>
              ) : null}
            </div>
          )}

          {!isCompletingGoogleProfile && (
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
          )}

          <div>
            <label
              htmlFor="mobile"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Mobile <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <HiOutlinePhone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
              <input
                id="mobile"
                type="tel"
                placeholder="Enter your Mobile Number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
                autoComplete="tel"
                className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:ring-2 focus:ring-[#ff5a36]/10 ${
                  errors.mobile
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-200 focus:border-[#ff5a36]"
                }`}
              />
            </div>
            {errors.mobile ? (
              <p className="mt-1 text-[11px] text-red-500">{errors.mobile}</p>
            ) : null}
          </div>

          {!isCompletingGoogleProfile && (
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
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
                  autoComplete="new-password"
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
          )}

          {isCompletingGoogleProfile && (
            <div className="rounded-lg border border-[#ffd7cb] bg-[#fff7f3] px-3 py-2 text-[12px] text-[#c86a4d]">
              Google connected successfully. Add your mobile number to finish creating your account.
            </div>
          )}

          {!isCompletingGoogleProfile && (
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Role <span className="text-red-500">*</span>
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
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full rounded-lg bg-[#ff5a36] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#f24d28] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <AuthButtonLoader
                label={isCompletingGoogleProfile ? "Completing Profile..." : "Signing Up..."}
              />
            ) : isCompletingGoogleProfile ? (
              "Complete Profile"
            ) : (
              "Sign Up"
            )}
          </button>

          {!isCompletingGoogleProfile && (
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isSubmitting || isGoogleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-[#ff5a36]/50 hover:bg-[#fff7f3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <AuthButtonLoader label="Connecting Google..." color="#ff5a36" />
              ) : (
                <>
                  <FcGoogle className="text-base" />
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          )}
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
