import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useMonitoring } from "../context/MonitoringContext";
import { useAnimate } from '@mui/x-charts/hooks';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { styled } from '@mui/material/styles';
import { interpolateObject } from '@mui/x-charts-vendor/d3-interpolate';
import { PieChart } from '@mui/x-charts/PieChart';
import { desktopOS, valueFormatter } from '../data/alert-pie';
import api from "../api";


// shared color for bar and pie cart
const chartColors = ['#8B0000', '#B22222', '#7F1D1D', '#A30000', '#FF0000', '#5A0000'] 


// bar-chart components and functions
const Text = styled('text')(({ theme, fill }) => ({
  ...theme?.typography?.body2,
  stroke: 'none',
  fill: fill || (theme.vars || theme)?.palette?.text?.primary,
  transition: 'opacity 0.2s ease-in, fill 0.2s ease-in',
  textAnchor: 'middle',
  dominantBaseline: 'central',
  pointerEvents: 'none',
}));

function BarLabel(props) {
  const {
    xOrigin,
    yOrigin,
    x,
    y,
    width,
    skipAnimation,
    ...otherProps
  } = props;

  if(y === 0) return null;

  const animatedProps = useAnimate(
    { x: x + width / 2, y: y - 8 },
    {
      initialProps: { x: x + width / 2, y: yOrigin },
      createInterpolator: interpolateObject,
      transformProps: (p) => p,
      applyProps: (element, p) => {
        element.setAttribute('x', p.x.toString());
        element.setAttribute('y', p.y.toString());
      },
      skip: skipAnimation,
    },
  );

  return (
    <Text {...otherProps} fill="#ffffff6e" textAnchor="middle" {...animatedProps} />
  );
}



function Alert() {
  const { serverCredentials, connected } = useMonitoring();
  const [paused, setPaused] = useState(false);
  const [data, setData] = useState([])
  const [barData, setBarData] = useState([0, 0, 0, 0, 0, 0]);
  const [pieData, setPieData] = useState([]);
  const [xAxisLabels, setXAxisLabels] = useState([]);

  // fetching anomalous data only 
  useEffect(() => {
  const fetchAnomalousData = async () => {
    try {
      const res = await api.get("/rtnc/anomalous-packet/");
      setData(res.data);

      // data for bar chart
      const types = ['Botnet', 'Bruteforce', 'DDoS', 'Infiltration', 'Portscan'];
      const counts = types.map(type => res.data.filter(packet => packet.prediction === type).length);

      // filter data ( <= 0 did not display)
      const filteredTypes = types.filter((_, i) => counts[i] > 0);
      const filteredCounts = counts.filter(count => count > 0);

      setBarData(filteredCounts);
      setXAxisLabels(filteredTypes)


      // calcukate the total packets
      const total = counts.reduce((acc, val) => acc + val, 0);

      // data for pie chart
      const pieChart = types.map((type, i) => ({
        label: type,
        value: total > 0 ? (((counts[i] / total) * 100).toFixed(2)) : 0,
        color: chartColors[i % chartColors.length]
      }));

      // remove 0 value in label
      const filteredPiechart = pieChart.filter(item => parseFloat(item.value), 0);

      setPieData(filteredPiechart);

    } catch (error) {
      console.error(error);
    }
  };

  fetchAnomalousData();
}, []);


  return (
    <div className="relative z-10 bg-[#0a0f1c] h-full text-white w-full">
      <div className="w-full p-0">
        <Header connected={connected} paused={paused} setPaused={setPaused} />
      </div>

      <div className="w-full grid grid-cols-5 gap-5 p-5">
        <div className="bar-chart relative flex col-span-3 px-3 pr-5 bg-[#0a0f1c] border border-white/10 rounded-sm text-white font-mono">
          <h6 className="absolute top-2 left-2 text-sm p-2 text-[#ffffffab]">Anomaly Type Count</h6>
          <ChartContainer
            className="mt-8"
            xAxis={[{ scaleType: 'band', data: xAxisLabels }]}
            series={[{
              type: 'bar',
              id: 'base',
              data: barData,
              color: "#a30000cb",
            }]}
            height={220}
            yAxis={[{ width: 30 }]}
            margin={{ left: 0, right: 10 }}
            sx={{
              '& text': {
                fontFamily: 'JetBrains Mono, Fira Code, Menlo, monospace !important',
              },
              '& .MuiChartsAxis-tickLabel': { fill: '#ffffff6e !important' },
              '& .MuiChartsAxis-line': { stroke: '#ffffff8c !important' },
              '& .MuiChartsGrid-line': { stroke: '#ffffff6e !important' },
            }}
          >
            <BarPlot barLabel="value" slots={{ barLabel: BarLabel }} />
            <ChartsXAxis />
            <ChartsYAxis />
          </ChartContainer>
        </div>

        <div className="pie-chart relative col-span-2 flex items-center justify-center bg-[#0a0f1c] border border-white/10 rounded-sm p-4 text-white font-mono">
          <h6 className="absolute top-2 left-2 text-sm p-2 text-[#ffffffab]">Total Contribution (%)</h6>
          <PieChart
            className="mt-6"
            series={[
              {
                data: pieData,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30, color: '#ffffff6e' },
                valueFormatter,
                label: {
                  color: '#ffffff6e',
                  fontFamily: 'JetBrains Mono, Fira Code, Menlo, monospace',
                },
              },
            ]}
            height={150}
            width={200}
            slotProps={{
              legend: {
                sx: {
                  ['.& .MuiChartsLegend-label']: {
                    fill: '#ffffff6e !important',
                    fontFamily: 'monospace !important',
                  },
                  ['.& .MuiChartsLegend-mark']: {
                    stroke: '#ffffff6e !important',
                    opacity: 0.7,
                  },
                  fontSize: 12,
                  color: '#ffffff6e',
                },
              },
            }}
            sx={{
              '& text': {
                fill: '#ffffff6e !important',
                fontFamily: 'monospace !important',
              },
              '& path': {
                stroke: '#ffffff6e',
                strokeWidth: 1,
                paddingTop: "2rem"
              },
            }}
          />
        </div>
      </div>

      <div className="table w-full p-0">
        <div className="px-5 pb-10">
        <div className="text-white font-mono text-sm mb-2"></div>
        <div className="overflow-y-auto max-h-[520px] border border-white/10 rounded-sm">
          <table className="min-w-full text-xs text-left text-white font-mono">
            <thead className="bg-[#5A0000] text-white/80 sticky top-0 z-10 text-[#ffffff7e]">
              <tr>
                <th className="px-4 py-3 border-b border-white/10">TIMESTAMP</th>
                <th className="px-4 py-3 border-b border-white/10">SOURCE IP</th>
                <th className="px-4 py-3 border-b border-white/10">DESTINATION IP</th>
                <th className="px-4 py-3 border-b border-white/10">TYPE</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {data.length > 0 ? (
                data.map(packet => (
              <tr key={packet.id} className="bg-red-800/10 hover:bg-yellow-800 border-b border-white/10 text-[#ffffff6e]">
                <td className="px-4 py-1">{new Date(packet.timestamp).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</td>
                <td className="px-4 py-1">{packet.src_ip}</td>
                <td className="px-4 py-1">{packet.dst_ip}</td>
                <td className="px-4 py-1">{packet.prediction}</td>
              </tr>
            ))
              ) : (
              <tr>
                <td colSpan={4} className="text-center text-white/50 py-6">
                  No data yet, maybe the server is not connected
                </td>
              </tr>
            )}
          </tbody>

          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Alert;
