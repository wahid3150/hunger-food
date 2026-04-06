import React from "react";
import { ClipLoader } from "react-spinners";

const AuthButtonLoader = ({ label, color = "#ffffff" }) => {
  return (
    <span className="flex items-center justify-center gap-2">
      <ClipLoader color={color} loading size={16} aria-label={`${label} loading`} />
      <span>{label}</span>
    </span>
  );
};

export default AuthButtonLoader;
