import { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import * as XLSX from "xlsx"
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Bar } from 'react-chartjs-2';
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
import dayjs from "dayjs";
import api from '../api';
import { useMemo } from "react";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Tooltip, 
  Legend
);


function Report() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // start: Date filter
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [packets, setPackets] = useState([]);
  const [dates, setDates] = useState([]);
  const predictionColors = {
    safe: "bg-teal-500/10",   // light green for safe
    anomaly: "bg-red-700/30", // bloody red for anomaly
  };

  // fetch available dates
  useEffect(() => {
    api
      .get("/rtnc/packets/dates/")
      .then((res) => setDates(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fromIndex = dates.indexOf(fromDate);
  const toOptions = fromIndex >= 0 ? dates.slice(fromIndex + 1) : dates;

  // fetch packets when both dates selected
  useEffect(() => {
    if (fromDate && toDate) {
      api
        .get(`/rtnc/packets/?from=${fromDate}&to=${toDate}`)
        .then((res) => setPackets(res.data))
        .catch((err) => console.error(err));
    }
  }, [fromDate, toDate]);
  // end: Date filter

  

  // start: cards
const {
  totalSafeTraffic,
  totalAnomalyTraffic,
  totalTrafficGB,
  totalUniqueIPs,
  safeTrafficPercent,
  anomalyTrafficPercent,
  totalTrafficPercent,
  uniqueIPsPercent
} = useMemo(() => {
  const totalSafeBytes = packets
    .filter((p) => p.prediction === "safe")
    .reduce((sum, p) => sum + Number(p.flow_bytes_s || 0), 0);

  const totalAnomalyBytes = packets
    .filter((p) => p.prediction !== "safe")
    .reduce((sum, p) => sum + Number(p.flow_bytes_s || 0), 0);

  const totalTrafficBytes = totalSafeBytes + totalAnomalyBytes;

  const bytesToGb = (bytes) => Number((bytes / 1024 ** 3).toFixed(5));

  const totalSafeTraffic = bytesToGb(totalSafeBytes);
  const totalAnomalyTraffic = bytesToGb(totalAnomalyBytes);
  const totalTrafficGB = bytesToGb(totalTrafficBytes);

  const totalUniqueIPs = new Set(packets.map((p) => p.src_ip)).size;

  const safeTrafficPercent = totalTrafficBytes ? (totalSafeBytes / totalTrafficBytes) * 100 : 0;
  const anomalyTrafficPercent = totalTrafficBytes ? (totalAnomalyBytes / totalTrafficBytes) * 100 : 0;
  const totalTrafficPercent = totalTrafficBytes ? 100 : 0;

  const uniqueIPsPercent = Math.min(totalUniqueIPs, 100); // simple fix for bar width

  return {
    totalSafeTraffic,
    totalAnomalyTraffic,
    totalTrafficGB,
    totalUniqueIPs,
    safeTrafficPercent,
    anomalyTrafficPercent,
    totalTrafficPercent,
    uniqueIPsPercent
  };
}, [packets]);



      // end: cards

    // start: bar chart
    const dailyData = packets.reduce((acc, p) => {
      const date = dayjs(p.timestamp).format("YYYY-MM-DD");
      if (!acc[date]) {
        acc[date] = { safe: 0, anomaly: 0 };
      }

      if (p.prediction === "safe") {
      acc[date].safe += 1;   // count safe packets
    } else {
      acc[date].anomaly += 1; // count anomaly packets
    }


      return acc;
    }, {});


  const labels = Object.keys(dailyData).sort();

  const safeData = labels.map((date) => dailyData[date].safe);
  const anomalyData = labels.map((date) => dailyData[date].anomaly);

  const anomalyRateData = labels.map((date) => {
    const safeCount = dailyData[date].safe;
    const anomalyCount = dailyData[date].anomaly;
    const totalCount = safeCount + anomalyCount;

    return totalCount > 0
      ? Math.round((anomalyCount / totalCount) * 100)
      : 0;
  });

  // bar chart data
  const ipTrafficData = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Anomaly Traffic",
        data: anomalyData,
        backgroundColor: "#f43f5dc7",
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "Safe Traffic",
        data: safeData,
        backgroundColor: "#14b8a5c0",
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Anomaly Rate (%)",
        data: anomalyRateData,
        borderColor: "#facc15",
        backgroundColor: "#facc15",
        yAxisID: "y1",
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
      },
    ],
  };

  // bar chart customization
  const ipTrafficOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "white",
          font: { family: "'Courier New', monospace" },
        },
      },
      tooltip: {
        enabled: true,
        bodyFont: { family: "'Courier New', monospace" },
        titleFont: { family: "'Courier New', monospace" },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: "white",
          font: { family: "'Courier New', monospace" },
        },
        ticks: {
          color: "white",
          font: { family: "'Courier New', monospace" },
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Packets (Count)",
          color: "white",
          font: { family: "'Courier New', monospace" },
        },
        ticks: {
          color: "white",
          font: { family: "'Courier New', monospace" },
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        title: {
          display: true,
          text: "Anomaly Rate (%)",
          color: "white",
          font: { family: "'Courier New', monospace" },
        },
        ticks: {
          callback: (val) => `${val}%`,
          color: "white",
          font: { family: "'Courier New', monospace" },
        },
        grid: { drawOnChartArea: false },
      },
    }
  };
  // end: bar chart

  // start: print to csv
const handlePrint = async () => {
  try {
    const chartCanvas = document.querySelector("#canvas");
    if (!chartCanvas) throw new Error("Chart not found");

    const chartImage = chartCanvas.toDataURL("image/png");

    // -----------------------------
    // 1️⃣ Workbook with two sheets
    // -----------------------------
    const workbook = new ExcelJS.Workbook();

    // --------- Sheet 1: Cards + Chart ---------
    const sheet1 = workbook.addWorksheet("Cards & Chart");

    // Cards in first column
    sheet1.getColumn(1).width = 25;
    sheet1.addRow(["Safe Traffic (GB)", totalSafeTraffic]);
    sheet1.addRow(["Anomaly Traffic (GB)", totalAnomalyTraffic]);
    sheet1.addRow(["Unique IPs", totalUniqueIPs]);
    sheet1.addRow(["Total Traffic (GB)", totalTrafficGB]);
    sheet1.addRow([]); // empty row

    // Add chart image
    const imageId = workbook.addImage({
      base64: chartImage,
      extension: "png",
    });

    const chartStartRow = sheet1.rowCount + 2;
    sheet1.addImage(imageId, {
      tl: { col: 0, row: chartStartRow },
      ext: { width: 800, height: 400 },
    });

    // --------- Sheet 2: Table ---------
    const sheet2 = workbook.addWorksheet("Network Table");

    // Table header with teal background
    const tableHeader = ["TIMESTAMP", "SOURCE IP", "DESTINATION IP", "CLASSIFICATION", "TYPE"];
    const headerRow = sheet2.addRow(tableHeader);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF14B8A5" }, // teal
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true }; // white text
      cell.alignment = { horizontal: "center" };
    });

    // Table rows
    packets.forEach((p) => {
      const formattedDate = new Date(p.timestamp).toLocaleDateString("en-US", {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      sheet2.addRow([
        formattedDate,
        p.src_ip,
        p.dst_ip,
        p.prediction === "safe" ? "safe" : "anomaly",
        p.prediction === "safe" ? "-" : p.prediction,
      ]);
    });

    // Auto-width columns
    sheet2.columns.forEach((col) => {
      let maxLength = 12;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      col.width = maxLength + 2;
    });

    // --------- Save workbook ---------
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "network_report.xlsx");

    alert("Report printed successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to print: " + err.message);
  }
};



  // end: print to csv

  return (
    <div className="relative z-10 bg-[#0a0f1c] min-h-screen text-white">

      {/* start: Header */}
      <Header connected={connected} paused={paused} setPaused={setPaused}/>
      {/* end : Header */}

      {/* start: from, to, and export buttons */}
      <div className="h-[6rem] w-full flex items-center justify-between px-6 font-mono relative z-20 fixed mt-[-2rem]">
        <div className="flex items-end text-base tracking-wide text-teal-500 space-x-4">
         {/* from date dropdown */}
          <div className="relative">
            <button
              onClick={() => setFromOpen(!fromOpen)}
              className="w-[7rem] p-2 text-xs rounded bg-teal-800/50 text-white text-center hover:bg-teal-700/50"
            >
              {fromDate || "From Date"}
            </button>
            {fromOpen && (
              <ul className="absolute left-0 mt-1 w-full bg-gray-900 rounded-md shadow-lg z-20">
                {dates.map((d, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setFromDate(d);
                      setToDate(null); // reset "To Date"
                      setFromOpen(false);
                    }}
                    className="p-2 text-xs text-white cursor-pointer hover:bg-teal-700"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* to date dropdown */}
          <div className="relative">
            <button
              onClick={() => setToOpen(!toOpen)}
              disabled={!fromDate}
              className={`w-[7rem] p-2 text-xs rounded text-center ${
                !fromDate
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-teal-800/50 text-white hover:bg-teal-700/50"
              }`}
            >
              {toDate || "To Date"}
            </button>
            {toOpen && (
              <ul className="absolute left-0 mt-1 w-full bg-gray-900 rounded-md shadow-lg z-20">
                {toOptions.map((d, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setToDate(d);
                      setToOpen(false);
                    }}
                    className="p-2 text-xs text-white cursor-pointer hover:bg-teal-700"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrint}
              disabled={!toDate} // ✅ disable if no To Date
              className={`h-[2rem] w-[8rem] text-xs tracking-wide transition-all rounded-[2px] 
                ${toDate 
                  ? "bg-blue-600/40 hover:bg-blue-400 text-white cursor-pointer" 
                  : "bg-gray-600/40 text-gray-400 cursor-not-allowed"
                }`}
            >
              PRINT REPORT
            </button>
          </div>

        </div>
      </div>
      {/* end: from, to, and export buttons */}

      {/* start: Cards */}
      <div className="flex px-6 gap-4">
        
        {/* Total Safe Traffic */}
        <div className="w-1/4 bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white font-mono">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-teal-600 rounded p-1">
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
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" 
                />
              </svg>
            </div>
            <h4 className="text-sm font-semibold">Safe Traffic</h4>
          </div>
          <div className="text-2xl font-bold">{totalSafeTraffic} GB</div>
          <div className="text-xs text-white/50 mb-1">Total safe traffic</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all"
              style={{ width: `${safeTrafficPercent || 0}%` }}
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
                strokeWidth={1.5} 
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
            <h4 className="text-sm font-semibold">Anomaly Traffic</h4>
          </div>
          <div className="text-2xl font-bold">{totalAnomalyTraffic} GB</div>
          <div className="text-xs text-white/50 mb-1">Total anomaly traffic</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all"
              style={{ width: `${anomalyTrafficPercent || 0}%` }}
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
            <h4 className="text-sm font-semibold">Unique IPs</h4>
          </div>
          <div className="text-2xl font-bold">{totalUniqueIPs}</div>
          <div className="text-xs text-white/50 mb-1">IP Address Count</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-teal-400 h-2 rounded-full transition-all"
              style={{ width: `${uniqueIPsPercent}%` }}
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
                strokeWidth={1.5} 
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
            <h4 className="text-sm font-semibold">Total Traffic</h4>
          </div>
          <div className="text-2xl font-bold">{totalTrafficGB} GB</div>
          <div className="text-xs text-white/50 mb-1">Total Traffic</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-teal-700 h-2 rounded-full transition-all"
              style={{ width: `${totalTrafficPercent || 0}%` }}
            />
          </div>
        </div>

      </div>
      {/* end: cards */}


      {/* start: Bar Chart */}
      <div className="flex px-6 mb-4" >
        <div className="w-full h-[15rem] bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white/70 font-mono mt-5">
          <Bar data={ipTrafficData} options={ipTrafficOptions} id="canvas" />
        </div>
      </div>
      {/* end: Bar Chart */}

      {/* start: table*/}
      <div className="px-6 pb-10">
        <div className="overflow-y-auto max-h-[400px] border border-white/10 rounded-sm ">
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
              {packets.length > 0 ? (
                packets.map((item, index) => {
                  const prediction = item.prediction;
                  return (
                    <tr
                      key={item.id || index}
                      className={`border-b border-white/10 hover:bg-white/2 ${prediction === 'safe' ? predictionColors.safe : predictionColors.anomaly}`}
                    >
                      <td className="px-4 py-1">{new Date(item.timestamp).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</td>
                      <td className="px-4 py-1">{item.src_ip}</td>
                      <td className="px-4 py-1">{item.dst_ip}</td>
                      <td className="px-4 py-1">{prediction === "safe" ? "safe" : "anomaly"}</td>
                      <td className="px-4 py-1">{prediction === "safe" ? "-" : prediction}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-white/50 py-6">
                    {fromDate && toDate
                      ? "No packets found for this date range"
                      : "Select From and To dates to view packets"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* end: table */}

    </div>
  );
}

export default Report;
