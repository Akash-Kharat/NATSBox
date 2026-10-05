import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { LoadTestDataPoint } from '../../../shared/types';

interface LoadTestChartProps {
  dataPoints: LoadTestDataPoint[];
}

export const LoadTestChart: React.FC<LoadTestChartProps> = ({ dataPoints }) => {
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Waiting for data...
      </div>
    );
  }

  // Format time for X-axis
  const formattedData = dataPoints.map(point => ({
    ...point,
    time: new Date(point.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="flex flex-col h-full space-y-4 pb-10">
      <div className="flex-1 min-h-[200px]">
        <h4 className="text-sm font-semibold text-gray-600 mb-2 text-center">Throughput (msgs/sec)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="time" tick={{fontSize: 12}} />
            <YAxis tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="sentRate" name="Sent Rate" stroke="#3b82f6" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="receivedRate" name="Received Rate" stroke="#10b981" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-h-[200px]">
        <h4 className="text-sm font-semibold text-gray-600 mb-2 text-center">Latency (ms)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="time" tick={{fontSize: 12}} />
            <YAxis tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="p50Latency" name="p50" stroke="#f59e0b" dot={false} />
            <Line type="monotone" dataKey="p95Latency" name="p95" stroke="#ef4444" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="p99Latency" name="p99" stroke="#8b5cf6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
