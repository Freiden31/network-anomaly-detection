import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import api from '../api';

function Form({ route, method, onOtpRequest, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("System Administrator");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login" : "Register";

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (method === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setLoading(false);
      return setError("Password must be atleast 8 characters.");
    }

    try {
      let res;
      if (method === "login") {
        const data = { email, password };
        res = await api.post(route, data);
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        formData.append("role", role);
        if (image) formData.append("profile_image", image);

        res = await api.post(route, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Registration successful! Please check your email for OTP.");
        localStorage.setItem("email", email);
        if (typeof onOtpRequest === "function") {
          onOtpRequest(); // switch to OTP form in Welcome
        } else {
          setTimeout(() => navigate("/verify-otp"), 2000); // fallback route navigation
        }
      }
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        if (data.email) {
          setError(data.email.join(" "));
        } else if (data.password) {
          setError(data.password.join(" "));
        } else if (data.profile_image) {
          setError(data.profile_image.join(" "));
        } else if (data.detail) {
          setError(data.detail);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else if (method === "login" && err.response?.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine border color based on password length
  const getPasswordBorderClass = (value) => {
    if (value.length > 0 && value.length < 8) {
      return "border-red-500";
    } else if (value.length >= 8) {
      return "border-teal-400";
    }
    return "border-white/30";
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0f1c] font-mono text-white">
      <div className="w-[25rem] px-6 py-8 bg-[#0f1115] border border-white/20 shadow-[0_0_80px_#14b8a640] rounded-sm text-sm">
        <h2 className="text-center text-white tracking-widest text-sm mb-4">
          {name}
        </h2>

        {error && <p className="text-red-500 text-xs mb-5">{error}</p>}
        {message && <p className="text-teal-400 text-xs mb-5">{message}</p>}

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col space-y-4 items-center">
          {/* Email */}
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-[20rem] mx-auto bg-transparent border border-white/30 px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-400 placeholder-white/40"
            required
          />

          {/* Image input appears only in registration, directly after email */}
          {method === "register" && (
            <div className="relative w-[20rem]">
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-transparent border border-white/30 px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-teal-400 cursor-pointer mb-4"
                required
              >
                
                <option value="System Administrator" className="bg-[#0f1115] text-white">
                  System Administrator
                </option>
                <option value="Network Administrator" className="bg-[#0f1115] text-white">
                  Network Administrator
                </option>
                <option value="Database Administrator" className="bg-[#0f1115] text-white">
                  Database Administrator
                </option>
                <option value="MIS Executive" className="bg-[#0f1115] text-white">
                  MIS Executive
                </option>
                <option value="IT Consultant" className="bg-[#0f1115] text-white">
                  IT Consultant
                </option>
                <option value="System Analyst" className="bg-[#0f1115] text-white">
                  System Analyst
                </option>
                <option value="Cloud Analyst" className="bg-[#0f1115] text-white">
                  Cloud Analyst
                </option>
              </select>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="hidden" // hidden input (width doesn't matter)
                required
              />
              <label
                htmlFor="image"
                className="block w-full border border-white/30 px-3 py-2 text-xs text-white/40 bg-transparent focus-within:border-teal-400 cursor-pointer text-left rounded-sm"
              >
                {image ? (
                  <span className="text-white">{image.name}</span>
                ) : (
                  <span className="text-white/40">Upload Profile</span>
                )}
              </label>
            </div>


          )}

          {/* Password */}
          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="off"
            className={`w-[20rem] mx-auto bg-transparent border px-3 py-2 text-white text-xs focus:outline-none placeholder-white/40 ${getPasswordBorderClass(password)}`}
            required
          />

          {/* Login-specific actions */}
          {method === "login" && (
            <div className="w-[20rem] mx-auto flex justify-between text-xs">
              <label className="flex items-center gap-1 text-white/70">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="accent-teal-500"
                />
                Show Password
              </label>

              <button
                type="button"
                onClick={() => onForgotPassword && onForgotPassword()}
                className="text-white hover:text-teal-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Register-specific fields */}
          {method === "register" && (
            <>
              <input
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                autoComplete="off"
                className={`w-[20rem] mx-auto bg-transparent border px-3 py-2 text-white text-xs focus:outline-none placeholder-white/40 ${getPasswordBorderClass(confirmPassword)}`}
                required
              />

              <div className="w-[20rem] mx-auto flex justify-start text-xs">
                <label className="flex items-center gap-1 text-white/70">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="accent-teal-500"
                  />
                  Show Password
                </label>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-[20rem] mx-auto mt-2 bg-teal-500 hover:bg-teal-400 text-black text-xs py-2 tracking-wide transition-all"
            disabled={loading}
          >
            {loading ? "Please wait..." : name}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Form;
