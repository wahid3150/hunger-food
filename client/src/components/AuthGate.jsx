import React from "react";
import { useSelector } from "react-redux";

const AuthGate = ({ children }) => {
  const status = useSelector((state) => state.user.status);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4 py-4">
        <div className="w-full max-w-[390px] rounded-[24px] border border-[#f1e5df] bg-white p-6 text-center text-sm font-medium text-slate-600 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          Loading...
        </div>
      </div>
    );
  }

  return children;
};

export default AuthGate;

