import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import api from '../api';
import { useMonitoring } from '../context/MonitoringContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, annotationPlugin);

function Dashboard() {
  const { 
    connected, 
    paused, 
    data, 
    startMonitoring, 
    stopMonitoring, 
    togglePause,
    chartData,
    ipTrafficData 
  } = useMonitoring();
  const [showForm, setShowForm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const [serverForm, setServerForm] = useState({
    'host': '',
    'username': '',
    'password': ''
  });
  const [profileImage, setProfileImage] = useState("https://i.pinimg.com/originals/aa/dd/1a/aadd1a84088cfa777014394359482d9a.png");

  const predictionColors = {
    "safe": "bg-teal-800/30 hover:bg-teal-700/50",
    "Botnet": "bg-red-800/30 hover:bg-red-700/50",
    "Bruteforce": "bg-orange-800/30 hover:bg-orange-700/50",
    "DDoS": "bg-purple-800/30 hover:bg-purple-700/50",
    "Infiltration": "bg-yellow-800/30 hover:bg-yellow-700/50",
    "DoS": "bg-pink-800/30 hover:bg-pink-700/50",
    "Portscan": "bg-blue-800/30 hover:bg-blue-700/50",
  };

  // Profile
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await api.get('/rtnc/user-profile/');
        if (response.data.profile_image) {
          setProfileImage(response.data.profile_image);
        }
        if (response.data.role) {
          setRole(response.data.role);
        }
      } catch (error) {
        console.error("Failed to fetch profile image:", error);
      }
    };
    fetchProfileImage();
  }, []);

  // Profile image dropdown function
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  // Pause and continue function
  const handleToggle = togglePause;

  // Condition function
  const handleButtonClick = () => {
    connected ? setShowDisconnectConfirm(true) : setShowForm(true);
  };

  // Disconnect button
  const handleDisconnect = async () => {
    await stopMonitoring();
    setShowDisconnectConfirm(false);
  };

  // Changes for form
  const handleChange = (e) => {
    setServerForm({ ...serverForm, [e.target.id]: e.target.value});
  };

  // Connecting cloud server
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ok = await startMonitoring(serverForm);
      if (ok) {
        setShowForm(false);
      } else {
        alert("Failed to connect!");
      }
    } catch (error) {
      alert("Could not connect to server!");
    }
  };

  // helper mb to gb
  const mbToGb = (mb) => {
    if (!connected || mb === 0) return '0.00';
    const gb = (mb / 1000).toFixed(2);  // Divide by 1000 for GB
    return Number(gb).toLocaleString();  // Adds commas, e.g., "7.85"
  };

  // Cards
  const safeTrafficPercent = ipTrafficData.summary?.safeTrafficPercent ?? 0;
  const anomalyTrafficPercent = ipTrafficData.summary?.anomalyTrafficPercent ?? 0;
  const uniqueIPsPercent = ipTrafficData.summary?.uniqueIPsPercent ?? 0;
  const totalTrafficPercent = ipTrafficData.summary?.totalTrafficPercent ?? 0;

  const totalSafeTraffic = ipTrafficData.summary?.totalSafeTraffic ?? 0;
  const totalAnomalyTraffic = ipTrafficData.summary?.totalAnomalyTraffic ?? 0;
  const totalTrafficMB = ipTrafficData.summary?.totalTrafficMB ?? 0;
  const totalUniqueIPs = ipTrafficData.summary?.totalUniqueIPs ?? 0;

  // Chart options with sliding timestamps
  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      animation: {
        duration: 1000,
        easing: 'linear',
        loop: false,
        onProgress: (animation) => {
          if (animation.currentStep === animation.numSteps) {
            if (chartData.labels && chartData.labels.length > 12) {
              chartData.labels.shift();
              chartData.datasets.forEach(dataset => dataset.data.shift());
            }
          }
        }
      }
    },
    scales: {
      x: { 
        ticks: { 
          color: 'white', 
          font: { family: "'Courier New', monospace" },
          maxTicksLimit: 12,
          callback: function(value, index, values) {
            return chartData.labels && index < chartData.labels.length ? chartData.labels[index] : '';
          }
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        animation: {
          x: {
            type: 'number',
            easing: 'linear',
            duration: 1000,
            from: (ctx) => {
              if (ctx.type === 'data' && ctx.mode === 'default' && !ctx.dropped) {
                return ctx.chart.scales.x.max + 1;
              }
              return ctx.chart.scales.x.getPixelForValue(ctx.index);
            },
            to: (ctx) => {
              if (ctx.type === 'data' && chartData.labels && chartData.labels.length > 12) {
                return ctx.index === 0 ? undefined : ctx.chart.scales.x.getPixelForValue(ctx.index);
              }
              return ctx.chart.scales.x.getPixelForValue(ctx.index);
            }
          }
        }
      },
      y: { 
        display: false,
        min: 0,
        max: 1,
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { display: false },   // hides ticks
        title: { display: false },   // hides axis label (the text)
        border: { display: false } 
      }
    },
  };

  // Network traffic rhythm
  const ipTrafficOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    plugins: {
      legend: { 
        position: 'top', 
        labels: { color: 'white', font: { family: "'Courier New', monospace" } } 
      },
      tooltip: { 
        enabled: true,
        bodyFont: { family: "'Courier New', monospace" },
        titleFont: { family: "'Courier New', monospace" }
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Traffic (Bytes)', color: 'white', font: { family: "'Courier New', monospace" } },
        ticks: { color: 'white', maxTicksLimit: 6, font: { family: "'Courier New', monospace" } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        title: { display: true, text: 'Top Five (5) IP Address', color: 'white', font: { family: "'Courier New', monospace" } },
        ticks: { color: 'white', font: { family: "'Courier New', monospace" } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
    font: {
      family: "'Courier New', monospace"
    },  
  };

  // // alarm sound if anomaly detected
  // const alarmRef = useRef(null);

  // useEffect(() => {
  //   const playAndStopAlarm = () => {
  //     if (alarmRef.current) {
  //       alarmRef.current.currentTime = 0;
  //       alarmRef.current.play().catch(() => {});
        
  //       // stop after 5 seconds
  //       setTimeout(() => {
  //         alarmRef.current.pause();
  //         alarmRef.current.currentTime = 0;
  //       }, 5000);
  //     }
  //   };playAndStopAlarm(); // run once on mount
  // }, []);

  const { hasAnomaly } = useMonitoring();

  return (
    <div className={`relative w-full z-10 min-h-screen text-white transition-colors duration-300 ${
        hasAnomaly ? "bg-[#050505cb] text-red-500 animate-pulse" : "bg-[#0a0f1c]"
      }`}>
      {/* <audio ref={alarmRef} src="/alarm.mp3" preload="auto" /> */}
    {/* Header */}
    <div className="h-[4rem] w-full flex items-center justify-between top-[-1rem] px-6 font-mono relative z-20 fixed bg-[#0a0f1c] border-white/10 left-0">
      <div className="flex items-end text-base tracking-wide text-teal-500">
        <span className="text-5xl font-extrabold leading-none">A</span>
        <span className="self-center ml-1">nomaly</span>
        <span className="ml-4 text-5xl font-extrabold leading-none">D</span>
        <span className="self-center ml-1">etection</span>
      </div>

      {/* Center the buttons */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
        {connected && (
          <button
            onClick={handleToggle}
            title={paused ? 'Continue' : 'Pause'}
            className={`w-[6rem] p-2 rounded transition text-white/80 flex items-center justify-center space-x-2 
              ${paused ? 'bg-rose-500/30 hover:bg-rose-500/30' : 'bg-teal-600/50 hover:bg-teal-500/30'}`}
          >
            {paused ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" strokeWidth="1" stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
                <span className="text-xs tracking-wide">Continue</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                <span className="text-xs tracking-wide">Pause</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={handleButtonClick}
          className={`h-[2rem] w-[6rem] text-xs tracking-wide transition-all rounded-[2px] ${
            connected
              ? 'bg-teal-500 hover:bg-teal-400 text-white'
              : 'bg-teal-600/50 hover:bg-teal-500 text-white/80'
          }`}
        >
          {connected ? 'Connected' : 'Connect'}
        </button>
      </div>

      {/* Right Section - Admin + Profile */}
      <div className="flex items-center space-x-3">
        <span className="text-white/70 text-sm">{role}</span>
        <div ref={menuRef} className="relative inline-block text-left">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center focus:outline-none"
          >
            <img
              src={profileImage}
              alt="profile"
              className="w-10 h-10 rounded-full border-2 border-teal-500"
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-[9rem] bg-[#0a0f1c] border border-white/10 rounded-sm shadow-[0_0_10px_rgba(20,184,166,0.3)] overflow-hidden text-center font-mono z-50">
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[0.85rem] text-left text-white/90 hover:bg-teal-500 hover:text-gray-100 transition-colors duration-200"
              >
                Account
              </Link>
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[0.85rem] text-left text-white/90 hover:bg-teal-500 hover:text-gray-100 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link
                to="/report"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[0.85rem] text-left text-white/90 hover:bg-teal-500 hover:text-gray-100 transition-colors duration-200"
              >
                Report
              </Link>
              <Link
                to="/alert"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[0.85rem] text-left text-white/90 hover:bg-teal-500 hover:text-gray-100 transition-colors duration-200"
              >
                Alert
              </Link>
              <button
                to="/welcome"
                onClick={() => {
                  localStorage.removeItem("access");
                  localStorage.removeItem("refresh");
                  setOpen(false);
                  window.location.replace("/welcome");
                }}
                className="block w-full text-left px-4 py-2 text-[0.85rem] text-white/90 hover:bg-teal-500 hover:text-gray-100 transition-colors duration-200"
              >
                Log Out
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
    {/* End Header */}


      {/* Connect Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-30">
          <form
            onSubmit={handleSubmit}
            className="bg-[#0f1115] border border-white/20 shadow-[0_0_80px_#14b8a640] rounded-sm p-6 space-y-4 w-[20rem] text-xs font-mono"
          >
            <h3 className="text-center tracking-wide mb-2">Server Credentials</h3>
            <input
              id='host'
              value={serverForm.host}
              onChange={handleChange}
              type="text"
              placeholder="IP Address"
              className="w-full px-3 py-2 bg-transparent border border-white/20 placeholder-white/30 focus:border-teal-400"
              required
            />
            <input
              id='username'
              value={serverForm.username}
              onChange={handleChange}
              type="text"
              placeholder="Username"
              className="w-full px-3 py-2 bg-transparent border border-white/20 placeholder-white/30 focus:border-teal-400"
              required
            />
            <input
              id='password'
              value={serverForm.password}
              onChange={handleChange}
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 bg-transparent border border-white/20 placeholder-white/30 focus:border-teal-400"
              required
            />
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-1 bg-gray-600 hover:bg-gray-500 text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-teal-500 hover:bg-teal-400 text-black"
              >
                Connect
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-[#0f1115] border border-white/20 shadow-[0_0_80px_#14b8a640] rounded-sm p-6 w-[22rem] text-xs text-white font-mono space-y-4">
            <h3 className="text-center tracking-wide">Are you sure you want to disconnect?</h3>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="px-4 py-1 bg-gray-600 hover:bg-gray-500 text-white"
              >
                No
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-1 bg-rose-500 hover:bg-rose-400 text-white"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="flex px-6 gap-4 mt-4">
        {/* Total Safe Traffic */}
        <div className="w-1/4 bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white font-mono">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-teal-600 rounded p-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="size-6"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" 
                />
              </svg>
            </div>
            <h4 className="text-sm text-gray-400 font-semibold">Safe Traffic</h4>
          </div>
          <div className="text-2xl text-gray-300 font-bold">{connected ? mbToGb(totalSafeTraffic) : 0} GB</div>
          <div className="text-xs text-white/50 mb-1">Total safe traffic of today</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all"
              style={{ width: `${connected ? safeTrafficPercent : 0}%` }}
            />
          </div>
        </div>

        {/* Total Anomaly Traffic */}
        <div className="w-1/4 bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white font-mono">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-rose-600 rounded p-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="size-6"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h4 className="text-sm text-gray-400 font-semibold">Anomaly Traffic</h4>
          </div>
          <div className="text-2xl text-gray-300 font-bold">{connected ? mbToGb(totalAnomalyTraffic) : 0} GB</div>
          <div className="text-xs text-white/50 mb-1">Total anomaly traffic of today</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all"
              style={{ width: `${connected ? anomalyTrafficPercent : 0}%` }}
            />
          </div>
        </div>

        {/* Total Unique IP Addresses */}
        <div className="w-1/4 bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white font-mono">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-teal-700 rounded p-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="size-6"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </div>
            <h4 className="text-sm text-gray-400 font-semibold">Unique IPs</h4>
          </div>
          <div className="text-2xl text-gray-300 font-bold">{connected ? totalUniqueIPs : 0}</div>
          <div className="text-xs text-white/50 mb-1">Active unique IP addresses of today</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-teal-400 h-2 rounded-full transition-all"
              style={{ width: `${connected ? uniqueIPsPercent : 0}%` }}
            />
          </div>
        </div>

        {/* Total MB Used */}
        <div className="w-1/4 bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white font-mono">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-teal-900 rounded p-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="size-6"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            </div>
            <h4 className="text-sm text-gray-400 font-semibold">Total Traffic</h4>
          </div>
          <div className="text-2xl font-bold">{connected ? mbToGb(totalTrafficMB) : 0} GB</div>
          <div className="text-xs text-gray-300 text-white/50 mb-1">Total MB used of today</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-teal-700 h-2 rounded-full transition-all"
              style={{ width: `${connected ? totalTrafficPercent : 0}%` }}
            />
          </div>
        </div>
      </div>
      {/* End Cards */}

      {/* Top 5 IP Addresses */}
      <div className="flex px-6 mb-4">
        <div className="w-full h-[15rem] bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white/70 font-mono mt-5">
          {connected ? (
            <Bar data={ipTrafficData} options={ipTrafficOptions} />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-center text-white/50 text-xs py-8">No data yet, maybe the server is not connected</div>
          )}
        </div>
      </div>
      {/* End Top 5 IP Addresses */}

      {/* Network Traffic Rhythm */}
      <div className="p-6">
        <div className="h-[10rem] bg-[#0a0f1c] border border-white/10 rounded-sm p-2 flex items-center justify-center text-white text-sm font-mono">
          {connected ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="text-center text-white/50 text-xs px-4">
              No data yet, maybe the server is not connected
            </div>
          )}
        </div>
      </div>
      {/* End Network Traffic Rhythm */}

      {/* Network Traffic Table */}
      <div className="px-6 pb-10">
        <div className="text-white font-mono text-sm mb-2"></div>
        <div className="overflow-y-auto max-h-[400px] border border-white/10 rounded-sm">
          <table className="min-w-full text-xs text-left text-white font-mono">
            <thead className="bg-[#1a1c23] text-white/80 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b border-white/10">TIMESTAMP</th>
                <th className="px-4 py-3 border-b border-white/10">SOURCE IP</th>
                <th className="px-4 py-3 border-b border-white/10">DESTINATION IP</th>
                <th className="px-4 py-3 border-b border-white/10">CLASSIFICATION</th>
                <th className="px-4 py-3 border-b border-white/10">TYPE</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {connected ? (
                data.map(item => {
                  // Protocol mapping
                  const protocolMap = {
                    1: "ICMP",
                    2: "IGMP",
                    6: "TCP",
                    17: "UDP",
                  };
                  const protocol = protocolMap[Math.floor(item.protocol)] || item.protocol;

                  // Flags summary
                  const flags = [];
                  if (item.syn_flag_count > 0) flags.push(`SYN=${item.syn_flag_count}`);
                  if (item.ack_flag_count > 0) flags.push(`ACK=${item.ack_flag_count}`);
                  if (item.fin_flag_count > 0) flags.push(`FIN=${item.fin_flag_count}`);
                  const flagsDisplay = flags.length > 0 ? flags.join(" ") : "-";

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-white/10 hover:bg-white/5 ${predictionColors[item.prediction] || "bg-white/10"}`}
                    >
                      <td className="px-4 py-1">{new Date(item.timestamp).toLocaleDateString('en-US',{
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</td>
                      <td className="px-4 py-1">{item.src_ip}</td>
                      <td className="px-4 py-1">{item.dst_ip}</td>
                      <td className="px-4 py-1">{item.prediction === "safe" ? "safe" : "anomaly"}</td>
                      <td className="px-4 py-1">{item.prediction === "safe" ? "-" : item.prediction}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-white/50 py-6">
                    No data yet, maybe the server is not connected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* End Network Traffic Table */}
    </div>
  );
}

export default Dashboard;