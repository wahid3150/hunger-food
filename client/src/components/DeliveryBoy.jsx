import React from "react";
import DashboardNavbar from "./DashboardNavbar";

const DeliveryBoy = () => {
  return (
    <div className="min-h-screen bg-[#fff8f5]">
      <DashboardNavbar />
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <h1 className="text-lg font-bold text-slate-900">Delivery Boy</h1>
        <p className="mt-1 text-sm text-slate-600">
          This is your delivery dashboard.
        </p>
      </div>
    </div>
  );
};

export default DeliveryBoy;
