import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("rtnc/forgot-password/", { email });

      // ✅ If backend explicitly confirms success
      if (res.data?.success) {
        setMessage("Please check your email to reset your password.");
        setTimeout(() => navigate("/login"), 10000);
      } else {
        // fallback (some APIs don’t return success field)
        setMessage("Please check your email to reset your password.");
        setTimeout(() => navigate("/login"), 10000);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Invalid email");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0f1c] font-mono text-white">
      <div className="w-[25rem] px-6 py-8 bg-[#0f1115] border border-white/20 shadow-[0_0_80px_#14b8a640] rounded-sm text-sm">
        <h2 className="text-center text-white tracking-widest text-sm mb-4">
          Forgot Password
        </h2>

        {error && <p className="text-red-500 text-xs mb-5">{error}</p>}
        {message && <p className="text-teal-400 text-xs mb-5">{message}</p>}

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex flex-col space-y-4 items-center"
        >
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Enter your email"
            className="w-[20rem] mx-auto bg-transparent border border-white/30 px-3 py-2 text-white text-xs 
                       focus:outline-none focus:border-teal-400 placeholder-white/40"
            required
          />

          <button
            type="submit"
            className="w-[20rem] mx-auto mt-2 bg-teal-500 hover:bg-teal-400 text-black text-xs py-2 
                       tracking-wide transition-all"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
