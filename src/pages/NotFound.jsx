import React from "react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-white">
      {/* 404 Text */}
      <div className="text-[150px] font-extrabold flex items-center">
        <span className="text-teal-500 drop-shadow-[0_0_15px_rgba(0,255,127,0.5)]">4</span>
        
        {/* Middle 0 with illustration */}
        <div className="relative mx-4">
          <div className="w-[150px] h-[150px] rounded-full bg-black border-8 text-teal-500 flex items-center justify-center text-6xl text-teal-500 drop-shadow-[0_0_15px_rgba(0,255,127,0.5)]">
            <span className="text-white">● ●</span>
          </div>
          {/* Character sitting on 0 */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 200"
              className="w-[120px]"
            >
              <circle cx="100" cy="100" r="90" fill="transparent" />
            </svg>
          </div>
        </div>

        <span className="text-teal-500 drop-shadow-[0_0_15px_rgba(0,255,127,0.7)]">4</span>
      </div>

      {/* Text */}
      <h1 className="text-3xl font-bold text-teal-500 mt-6">Not Found!</h1>
      <p className="text-gray-400 mt-2">Let’s go login, buddy!</p>

      {/* Button */}
      <a
        href="/welcome"
        className="mt-6 px-6 py-2 bg-teal-500 text-black font-semibold round-sm hover:bg-teal-400 transition"
      >
        Go to Login
      </a>
    </div>
  );
}
