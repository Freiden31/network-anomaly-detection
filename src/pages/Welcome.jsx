import React, { useState, useEffect } from "react";
import Register from "./Register";
import Login from "./Login";
import homeImage from "../assets/welcomeImage.png";
import OTPForm from "./VerifyOtp";
import ForgotPasswordForm from "./ForgotPassword";

function Welcome() {
  const [showPage, setShowPage] = useState(true); // toggle register/login
  const [showOtp, setShowOtp] = useState(false);  // toggle OTP
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handlePageClick = () => setShowPage(!showPage);

  useEffect(() => {
    const otpVerified = localStorage.getItem("otpVerified");
    if (otpVerified === "true") {
      // Show login and hide OTP/forgot forms
      setShowOtp(false);
      setShowForgotPassword(false);
      setShowPage(true);
      localStorage.removeItem("otpVerified"); // cleanup
    }
  }, []);

  return (
    <div className="w-full h-screen absolute left-0 top-0 z-10 bg-[#0a0f1c] text-white font-mono">
      {/* Header */}
      <div className="h-[6rem] w-full fixed top-0 left-0 z-50 flex items-center justify-between px-[14rem] py-[4rem] bg-[#0a0f1c]">
        {/* Logo */}
        <div className="flex items-end text-base tracking-wide text-teal-500">
          <span className="text-5xl font-extrabold leading-none">A</span>
          <span className="self-center ml-1">nomaly</span>
          <span className="ml-4 text-5xl font-extrabold leading-none">D</span>
          <span className="self-center ml-1">etection</span>
        </div>

        {/* Toggle Button */}
        {!showOtp && !showForgotPassword && (
          <div className="flex gap-4">
            <button
              onClick={handlePageClick}
              className="w-[6rem] p-2 rounded text-white/80 flex items-center justify-center space-x-2 bg-teal-600/50 hover:bg-teal-700"
            >
              {showPage ? "Register" : "Login"}
            </button>
          </div>
        )}
      </div>

      {/* Main Section */}
      <div className="w-full h-full grid grid-cols-5 px-[12rem]" id="top">
        {/* Left Image */}
        <div className="flex flex-col justify-center items-center col-span-3">
          <img src={homeImage} alt="Welcome" className="max-w-full h-auto" />
        </div>

        {/* Right Form Area */}
        <div className="flex justify-center items-center col-span-2 pl-[6rem]">
          {showOtp ? (
            <OTPForm
              onOtpVerified={() => {
                setShowOtp(false);
                setShowForgotPassword(false);
                setShowPage(true);
              }}
            />
          ) : showForgotPassword ? (
            <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
          ) : showPage ? (
            <Login onForgotPassword={() => setShowForgotPassword(true)} />
          ) : (
            <Register onOtpRequest={() => setShowOtp(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Welcome;
