import React from "react";
import { useSelector } from "react-redux";
import UserDashboard from "../components/UserDashboard";
import OwnerDashboard from "../components/OwnerDashboard";
import DeliveryBoy from "../components/DeliveryBoy";

const Home = () => {
  const user = useSelector((state) => state.user.userData);
  const role = user?.role;

  if (role === "owner") {
    return <OwnerDashboard />;
  }

  if (role === "deliveryBoy") {
    return <DeliveryBoy />;
  }

  if (role === "user") {
    return <UserDashboard />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4 py-4">
      <div className="w-full max-w-[480px] rounded-[24px] border border-[#f1e5df] bg-white p-6 text-center text-sm text-slate-600 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <p className="font-semibold text-slate-800">Unable to load dashboard</p>
        <p className="mt-1">
          Your account role is missing or not supported.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Role: <span className="font-mono">{String(role ?? "null")}</span>
        </p>
      </div>
    </div>
  );
};

export default Home;
