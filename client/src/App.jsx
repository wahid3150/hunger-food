import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useSocket from "./hooks/useSocket";
import { useSelector } from "react-redux";
import Home from "./pages/Home";
import AuthGate from "./components/AuthGate";
import CartPage from "./pages/CartPage";
import CheckOut from "./pages/CheckOut";
export const serverUrl = "http://localhost:8000";

const App = () => {
  useGetCurrentUser();
  useSocket();
  const user = useSelector((state) => state.user.userData);

  return (
    <AuthGate>
      <Routes>
        <Route
          path="/"
          element={!user ? <Navigate to="/signup" replace /> : <Home />}
        />
        <Route
          path="/signup"
          element={!user ? <SignUp /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signin"
          element={!user ? <SignIn /> : <Navigate to="/" replace />}
        />
        <Route
          path="/forgot-password"
          element={!user ? <ForgotPassword /> : <Navigate to="/" replace />}
        />
        <Route
          path="/cart"
          element={user ? <CartPage /> : <Navigate to="/signin" replace />}
        />
        <Route
          path="/checkout"
          element={user ? <CheckOut /> : <Navigate to="/signin" replace />}
        />
      </Routes>
    </AuthGate>
  );
};

export default App;
