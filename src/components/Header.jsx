import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

// MUI
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

function Header({ connected, paused, setPaused }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState(
    "https://i.pinimg.com/originals/aa/dd/1a/aadd1a84088cfa777014394359482d9a.png"
  );
  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  // Fetch profile image
  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await api.get('/rtnc/user-profile/');
      if (response.data.profile_image) {
        setProfileImage(response.data.profile_image);
      }
      if (response.data.role) {
        setRole(response.data.role);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };
  fetchProfile();
}, []);
  // Pause/Continue toggle
  const handleToggle = async () => {
    try {
      if (paused) {
        await api.post("/rtnc/continue-monitoring/");
      } else {
        await api.post("/rtnc/pause-monitoring/");
      }
      setPaused(!paused);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    handleClose();
    navigate("/welcome", { replace: true });
  };

  // Dropdown open/close
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="h-[4rem] w-full flex items-center justify-between px-6 top-[-1rem] font-mono relative z-20 fixed bg-[#0a0f1c]  border-white/10">
      {/* Logo */}
      <div className="flex items-end text-base tracking-wide text-teal-500">
        <span className="text-5xl font-extrabold leading-none">A</span>
        <span className="self-center ml-1">nomaly</span>
        <span className="ml-4 text-5xl font-extrabold leading-none">D</span>
        <span className="self-center ml-1">etection</span>
      </div>

     

      {/* Right Section - Admin + Profile */}
      <div className="flex items-center space-x-3">
        <span className="text-white/70 text-sm">{role}</span>
        <div className="relative inline-block text-left">
          <button
            onClick={handleClick}
            className="flex items-center focus:outline-none"
          >
            <img
              src={profileImage}
              alt="profile"
              className="w-10 h-10 rounded-full border-2 border-teal-500"
            />
          </button>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                marginTop: "9px",
                bgcolor: "#0a0f1c", // same as Tailwind bg-[#0a0f1c]
                color: "rgba(255,255,255,0.9)", // text-white/90
                border: "1px solid rgba(255,255,255,0.1)", // border-white/10
                boxShadow: "0 0 10px rgba(20,184,166,0.3)", // teal glow shadow
                fontFamily: "'Courier New', monospace", // font-mono
                textAlign: "center", // text-center
                minWidth: "9rem",
                "& .MuiMenuItem-root": {
                  fontSize: "0.80rem",
                  color: "rgba(255,255,255,0.9)",
                  transition: "background-color 0.2s, color 0.2s",
                  "&:hover": {
                    backgroundColor: "rgb(20,184,166)", // hover:bg-teal-500
                    color: "rgb(243,244,246)", // hover:text-gray-100
                  },
                },
              },
            }}
          >
            <MenuItem component={Link} to="/account" onClick={handleClose}>
              Account
            </MenuItem>
            <MenuItem component={Link} to="/" onClick={handleClose}>
              Dashboard
            </MenuItem>
            <MenuItem component={Link} to="/report" onClick={handleClose}>
              Report
            </MenuItem>
            <MenuItem component={Link} to="/alert" onClick={handleClose}>
              Alert
            </MenuItem>
            <MenuItem onClick={handleLogout}>Log Out</MenuItem>
          </Menu>
        </div>
      </div>
    </div>
  );
}

export default Header;
