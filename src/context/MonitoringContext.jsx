import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api";

const MonitoringContext = createContext();

export const MonitoringProvider = ({ children }) => {
  const [hasAnomaly, setHasAnomaly] = useState(false); 
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const [serverCredentials, setServerCredentials] = useState(null)

  // NEW: Chart and Top IP data
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [ipTrafficData, setIpTrafficData] = useState({
    labels: [],
    datasets: [
      { label: 'Anomaly Traffic', data: [], backgroundColor: '#f43f5dc7' },
      { label: 'Safe Traffic', data: [], backgroundColor: '#14b8a5c0' },
    ],
    summary: {},
  });

  // start monitoring
  const startMonitoring = async (serverForm) => {
    try {
      const res = await api.post("/rtnc/start-monitoring/", serverForm);
      if (res.status === 200) {
        setConnected(true);

        // 👇 Save masked credentials temporarily in memory
        const maskedPassword =
          serverForm.password.length > 3
            ? "*****************" + serverForm.password.slice(-3)
            : "*************";

        setServerCredentials({
          host: serverForm.host,
          username: serverForm.username,
          password: maskedPassword,
        });

        return true;
      }
    } catch (err) {
      setError("Failed to connect");
    }
    return false;
  };

  // stop monitoring
  const stopMonitoring = async () => {
    try {
      await api.post("/rtnc/stop-monitoring/");
      setConnected(false);
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  };

  // pause/continue
  const togglePause = async () => {
    try {
      if (paused) {
        await api.post("/rtnc/continue-monitoring/");
      } else {
        await api.post("/rtnc/pause-monitoring/");
      }
      setPaused(!paused);
    } catch (err) {
      console.error("Error:", err);
    }
  };


  // alarm sound if anomaly detecten
  const alarmRef = useRef(null);
  const previousAnomalyIds = useRef(new Set()); // track past anomalies

  useEffect(() => {
    if (!connected || paused) return;

    const fetchData = async () => {
      try {
        const res = await api.get("/rtnc/packet-list/");
        setData(res.data);

        // find all anomaly packets
        const anomalies = res.data.filter(item => item.prediction !== "safe");
        const anomalyIds = new Set(anomalies.map(a => a.id || a.timestamp)); 
        setHasAnomaly(anomalies.length > 0);

        // binigay ni gpt
        let hasNewAnomaly = false;
        anomalies.forEach(a => {
          const key = a.id || a.timestamp;
          if (!previousAnomalyIds.current.has(key)) {
            hasNewAnomaly = true;
          }
        });

        previousAnomalyIds.current = anomalyIds;


        if (hasNewAnomaly && alarmRef.current) {
          alarmRef.current.currentTime = 0;
          alarmRef.current.play().catch(() => console.warn("Audio blocked"));

          setTimeout(() => {
            if (alarmRef.current) {
              alarmRef.current.pause();
              alarmRef.current.currentTime = 0;
            }
          }, 5000);
        }

      } catch (error) {
        setError(error.message);
        setConnected(false);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, [connected, paused]);



  // Chart Data (Network Traffic Rhythm)
  useEffect(() => {
    if (!connected || paused) return;

    const fetchChartData = async () => {
      try {
        const res = await api.get("/rtnc/packet-list/");
        const packets = res.data.slice().reverse();
        const labels = packets.map(item => new Date(item.timestamp).toISOString().slice(11, 19));
        const dData = res.data.map(item => item.prediction === "safe" ? 0 : 1);
        const segmentColor = { borderColor: ctx => ((ctx.p0.parsed.y + ctx.p1.parsed.y)/2 > 0.5 ? '#f43f5d' : '#14b8a5') };

        setChartData({
          labels,
          datasets: [
            {
              label: 'Prediction',
              data: dData,
              segment: segmentColor,
              borderWidth: 2,
              pointRadius: 0,
              fill: true,           // <--- add this
              tension: 0.4,           // <--- set to 0 (straight line)
              stepped: true,        // <--- makes the transitions sharp, no curves
              yAxisID: 'yD'

            },
            { label: 'Reference Line (0.5)', data: Array(labels.length).fill(0.5), borderColor:'white', borderWidth:1, borderDash:[4,4], pointRadius:0, fill:false, yAxisID:'yD', tension:0 },
          ]
        });
      } catch(err) { console.error(err); }
    };

    fetchChartData();
    const id = setInterval(fetchChartData, 3000);
    return () => clearInterval(id);
  }, [connected, paused]);

  // Top 5 IP Bar Chart
  useEffect(() => {
    if (!connected || paused) return;

    const fetchTopIPs = async () => {
      try {
        const res = await api.get("/rtnc/packet-list/");
        const packets = res.data;

        const host = localStorage.getItem("host") || "";
        const filtered = packets.filter(p => p.src_ip !== host);

        const trafficMap = {};
        filtered.forEach(p => {
          if (!trafficMap[p.src_ip]) trafficMap[p.src_ip] = { safe: 0, anomaly: 0 };
          if (p.prediction === "safe") trafficMap[p.src_ip].safe += p.flow_bytes_s;
          else trafficMap[p.src_ip].anomaly += p.flow_bytes_s;
        });

        let totalSafe=0, totalAnomaly=0;
        Object.values(trafficMap).forEach(t => { totalSafe += t.safe; totalAnomaly += t.anomaly; });
        const bytesToMB = b => b / (1024*1024);
        const totalSafeTraffic = bytesToMB(totalSafe);
        const totalAnomalyTraffic = bytesToMB(totalAnomaly);
        const totalTrafficMB = totalSafeTraffic + totalAnomalyTraffic;
        const totalUniqueIPs = Object.keys(trafficMap).length;

        const topIPs = Object.entries(trafficMap)
          .map(([ip, t]) => ({ ip, safe: t.safe, anomaly: t.anomaly }))
          .sort((a,b) => b.anomaly - a.anomaly).slice(0,5);

        setIpTrafficData({
          labels: topIPs.map(ipObj => ipObj.ip),
          datasets: [
            { label:'Anomaly Traffic', data: topIPs.map(ipObj => ipObj.anomaly), backgroundColor:'#f43f5dc7' },
            { label:'Safe Traffic', data: topIPs.map(ipObj => ipObj.safe), backgroundColor:'#14b8a5c0' },
          ],
          summary: { totalSafeTraffic, totalAnomalyTraffic, totalTrafficMB, totalUniqueIPs }
        });
      } catch(err) { console.error(err); }
    };

    fetchTopIPs();
    const id = setInterval(fetchTopIPs, 3000);
    return () => clearInterval(id);
  }, [connected, paused]);

  return (
    <MonitoringContext.Provider
      value={{
        connected,
        paused,
        data,
        error,
        hasAnomaly,
        startMonitoring,
        stopMonitoring,
        togglePause,
        chartData,
        ipTrafficData,
        serverCredentials,
        setServerCredentials
      }}
    >
      <audio ref={alarmRef} src="/alarm.mp3" preload="auto" />
      {children}
    </MonitoringContext.Provider>
  );
};

// hook
export const useMonitoring = () => useContext(MonitoringContext);
