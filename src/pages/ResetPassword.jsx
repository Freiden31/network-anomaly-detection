import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import homeImage from "../assets/welcomeImage.png"; 


function ResetPasswordForm() {
  const { uidb64, token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8){
      setLoading(false);
      return setError("Password must be at least 8 characters.");
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post(`rtnc/reset-password/${uidb64}/${token}/`, { password });
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
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

        
      </div>

      {/* Main Section */}
      <div className="w-full h-full grid grid-cols-5 px-[12rem]" id="top">
        {/* Left Image */}
        <div className="flex flex-col justify-center items-center col-span-3">
          <img src={homeImage} alt="Welcome" className="max-w-full h-auto" />
        </div>

        {/* Right Form Area */}
        <div className="flex justify-center items-center col-span-2 pl-[6rem]">
          <div className="w-[25rem] px-6 py-8 bg-[#0f1115] border border-white/20 shadow-[0_0_80px_#14b8a640] rounded-sm text-sm">
         <h2 className="text-center text-white tracking-widest text-sm mb-4">
           Reset Password
         </h2>

        {error && <p className="text-red-500 text-xs mb-5">{error}</p>}
         {message && <p className="text-teal-400 text-xs mb-5">{message}</p>}

         <form onSubmit={handleSubmit} className="flex flex-col space-y-4 items-center">
           <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            className={`w-[20rem] mx-auto bg-transparent border px-3 py-2 text-white text-xs 
                       focus:outline-none placeholder-white/40 ${getPasswordBorderClass(password)}`}
            required
          />

          <input
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className={`w-[20rem] mx-auto bg-transparent border px-3 py-2 text-white text-xs 
                       focus:outline-none placeholder-white/40 ${getPasswordBorderClass(confirmPassword)}`}
            required
          />

          {/* Show password checkbox */}
          <div className="w-[20rem] mx-auto text-left text-xs">
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

          <button
            type="submit"
            className="w-[20rem] mx-auto mt-2 bg-teal-500 hover:bg-teal-400 text-black text-xs py-2 
                       tracking-wide transition-all"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordForm;

















// import React, { useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import api from "../api";

// function ResetPasswordForm() {
//   const { uidb64, token } = useParams();
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (password !== confirmPassword) {
//       setError("Passwords do not match");
//       return;
//     }
//     setLoading(true);
//     setError("");
//     setMessage("");

//     try {
//       await api.post(`rtnc/reset-password/${uidb64}/${token}/`, { password });
//       setMessage("Password reset successfully! Redirecting to login...");
//       setTimeout(() => navigate("/login"), 2000);
//     } catch (err) {
//       if (err.response?.data?.detail) {
//         setError(err.response.data.detail);
//       } else {
//         setError("Something went wrong. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Determine border color based on password length
//   const getPasswordBorderClass = (value) => {
//     if (value.length > 0 && value.length < 8) {
//       return "border-red-500";
//     } else if (value.length >= 8) {
//       return "border-teal-400";
//     }
//     return "border-white/30";
//   };

//   return (
//     <div className="w-full h-full flex items-center justify-center bg-[#0a0f1c] font-mono text-white">
//       <div className="w-[25rem] px-6 py-8 bg-[#0f1115] border border-white/20 shadow-[0_0_80px_#14b8a640] rounded-sm text-sm">
//         <h2 className="text-center text-white tracking-widest text-sm mb-4">
//           Reset Password
//         </h2>

//         {error && <p className="text-red-500 text-xs mb-5">{error}</p>}
//         {message && <p className="text-teal-400 text-xs mb-5">{message}</p>}

//         <form onSubmit={handleSubmit} className="flex flex-col space-y-4 items-center">
//           <input
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             type={showPassword ? "text" : "password"}
//             placeholder="New Password"
//             className={`w-[20rem] mx-auto bg-transparent border px-3 py-2 text-white text-xs 
//                        focus:outline-none placeholder-white/40 ${getPasswordBorderClass(password)}`}
//             required
//           />

//           <input
//             id="confirmPassword"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             type={showPassword ? "text" : "password"}
//             placeholder="Confirm Password"
//             className={`w-[20rem] mx-auto bg-transparent border px-3 py-2 text-white text-xs 
//                        focus:outline-none placeholder-white/40 ${getPasswordBorderClass(confirmPassword)}`}
//             required
//           />

//           {/* Show password checkbox */}
//           <div className="w-[20rem] mx-auto text-left text-xs">
//             <label className="flex items-center gap-1 text-white/70">
//               <input
//                 type="checkbox"
//                 checked={showPassword}
//                 onChange={() => setShowPassword(!showPassword)}
//                 className="accent-teal-500"
//               />
//               Show Password
//             </label>
//           </div>

//           <button
//             type="submit"
//             className="w-[20rem] mx-auto mt-2 bg-teal-500 hover:bg-teal-400 text-black text-xs py-2 
//                        tracking-wide transition-all"
//             disabled={loading}
//           >
//             {loading ? "Resetting..." : "Reset Password"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default ResetPasswordForm;