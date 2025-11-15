import { useState, useEffect } from "react";
import Header from "../components/Header";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useMonitoring } from "../context/MonitoringContext";

function maskHash(hash) {
  if (!hash) return "*".repeat(13);
  const last = hash.slice(-3);
  return "*".repeat(17) + last;
}

function Account() {
  const [paused, setPaused] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(
    "https://i.pinimg.com/originals/aa/dd/1a/aadd1a84088cfa777014394359482d9a.png"
  );
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const { serverCredentials, connected } = useMonitoring();

  // Fetch user info
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await api.get("/rtnc/user-profile/");
        if (response.data.profile_image) setProfileImage(response.data.profile_image);
        if (response.data.role) setRole(response.data.role);
        if (response.data.email) setEmail(response.data.email);
        if (response.data.password) setPassword(maskHash(response.data.password));
      } catch (error) {
        console.log("Failed to fetch information: ", error);
      }
    };

    fetchInfo();

    // Get tokens from localStorage
    const storedAccess = localStorage.getItem(ACCESS_TOKEN);
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN);
    if (storedAccess) setAccessToken(storedAccess);
    if (storedRefresh) setRefreshToken(storedRefresh);
  }, []);

  // Delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      return;
    }

    try {
      await api.delete("rtnc/delete-account/");
      alert("Your account has been deleted!");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      console.error("Failed to delete account: ", err);
      alert("Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="relative z-10 bg-[#0a0f1c] min-h-screen text-white">
      {/* Header */}
      <Header connected={connected} paused={paused} setPaused={setPaused} />

      <div className="flex px-6 mb-4">
        <div className="relative w-full bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white/70 font-mono mt-5 flex flex-col items-start text-md">
          {/* Profile Image */}
          <div className="profile h-40 w-40 mt-5 ml-5 rounded-full">
            <img
              src={profileImage}
              alt="Profile"
              className="h-full w-full rounded-full border-4 border-teal-500"
            />
          </div>

          {/* Account Info */}
          <div className="information flex flex-col mt-6 ml-5 space-y-2 text-left">
            <h4 className="text-lg font-semibold text-white mb-2">ACCOUNT INFORMATION</h4>
            <div className="flex gap-10"><p className="font-semibold text-white/70 w-30">Email:</p><span>{email}</span></div>
            <div className="flex gap-10"><p className="font-semibold text-white/70 w-30">Role:</p><span>{role}</span></div>
          </div>

          {/* Server Info */}
          <div className="information flex flex-col mt-8 ml-5 space-y-2 text-left">
            <h4 className="text-lg font-semibold text-white mb-2 mt-2">SERVER CREDENTIALS</h4>
            <div className="flex gap-10"><p className="font-semibold text-white/70 w-30">IP Address:</p><span>{connected && serverCredentials ? serverCredentials.host : "Not connected"}</span></div>
            <div className="flex gap-10"><p className="font-semibold text-white/70 w-30">Username:</p><span>{connected && serverCredentials ? serverCredentials.username : "Not connected"}</span></div>
            <div className="flex gap-10"><p className="font-semibold text-white/70 w-30">Password:</p><span>{connected && serverCredentials ? serverCredentials.password : "Not connected"}</span></div>
          </div>

          

          {/* Bottom-right button */}
          <button
            onClick={handleDeleteAccount}
            className="absolute bottom-4 right-4 bg-rose-600 hover:bg-rose-700 text-white/80 px-5 py-2 rounded-md font-semibold transition"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Account;
