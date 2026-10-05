import React, { useState, useEffect } from 'react';
import { useLoadTestStore } from '../../stores/loadTestStore';
import { LoadTestChart } from './LoadTestChart';
import { Play, Square, ArrowLeft, Activity, AlertCircle, Clock, CheckCircle2, Zap, BarChart2 } from 'lucide-react';
import { LoadTestConfig } from '../../../shared/types';

interface LoadTestDashboardProps {
  config: LoadTestConfig;
  onBack: () => void;
}

export const LoadTestDashboard: React.FC<LoadTestDashboardProps> = ({ config, onBack }) => {
  const store = useLoadTestStore();
  const [testId, setTestId] = useState<string | null>(null);
  
  useEffect(() => {
    const unsub = (window as any).natsAPI?.onLoadTestProgress?.((_event: any, prog: any) => {
      store.updateProgress(prog);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [store]);

  const progress = testId ? store.activeTests[testId] : null;
  const isRunning = progress?.status === 'running';

  const handleStart = async () => {
    try {
      const id = await store.startTest(config);
      setTestId(id);
    } catch (error) {
      console.error('Failed to start test', error);
    }
  };

  const handleStop = async () => {
    if (testId) {
      await store.stopTest(testId);
    }
  };

  const sentCount = (progress as any)?.messagesSent ?? (progress as any)?.sent ?? 0;
  const receivedCount = (progress as any)?.messagesReceived ?? (progress as any)?.received ?? 0;
  const errorCount = progress?.errors ?? 0;
  const latency = progress?.avgLatencyMs ?? 0;
  
  const currentRate = progress?.currentRate ?? 0;

  const percentage = progress ? Math.min(100, Math.round(((sentCount + receivedCount) / (config.totalMessages * (config.type === 'request-reply' ? 2 : 1))) * 100)) : 0;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      
      {/* Top Header Workspace info */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Back to Load Tests"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Zap size={14} />
              </div>
              <h1 className="text-lg font-bold text-gray-900">{config.name}</h1>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold ${
                isRunning ? 'bg-blue-100 text-blue-700' : progress?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {isRunning ? (
                  <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Running</>
                ) : progress?.status === 'completed' ? (
                  <><CheckCircle2 size={10} /> Completed</>
                ) : (
                  <><Square size={10} /> Ready</>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5 ml-9">
              {config.type.toUpperCase()} • {config.subject} • {config.ratePerSecond || (config as any).ratePerSec} msgs/sec
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button 
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Play size={16} fill="currentColor" /> Start Execution
            </button>
          ) : (
            <button 
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 shadow-sm animate-pulse transition-colors"
            >
              <Square size={16} fill="currentColor" /> Stop Test
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Progress Bar Area */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-5 py-3 flex justify-between items-center bg-gray-50/50">
               <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
               <span className="text-sm font-bold font-mono text-indigo-700">{percentage}%</span>
             </div>
             <div className="w-full bg-gray-100 h-3">
                <div 
                  className={`h-full transition-all duration-300 ease-out ${percentage === 100 ? 'bg-green-500' : 'bg-indigo-600'}`} 
                  style={{ width: `${percentage}%` }}
                />
             </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <ArrowLeft className="rotate-45" size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Messages Sent</div>
                <div className="text-2xl font-black font-mono text-gray-800 mt-1">{sentCount.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0">
                <ArrowLeft className="-rotate-135" size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Messages Rcvd</div>
                <div className="text-2xl font-black font-mono text-gray-800 mt-1">{receivedCount.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Errors</div>
                <div className="text-2xl font-black font-mono text-gray-800 mt-1">{errorCount.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Latency</div>
                <div className="text-2xl font-black font-mono text-gray-800 mt-1">{latency.toFixed(1)}<span className="text-sm font-medium text-gray-400 ml-1">ms</span></div>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
             <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-gray-400" />
                  <h3 className="font-semibold text-gray-800">Live Telemetry</h3>
                </div>
                <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded text-gray-700 font-semibold border border-gray-200">
                  {currentRate.toLocaleString()} <span className="text-xs text-gray-500 font-sans uppercase">msgs/sec</span>
                </div>
             </div>
             <div className="flex-1 p-5">
               {progress && (progress.dataPoints?.length ?? 0) > 0 ? (
                 <LoadTestChart dataPoints={progress.dataPoints ?? []} />
               ) : (
                 <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                   <BarChart2 size={48} className="mb-4 text-gray-200" />
                   <p className="font-medium">No telemetry data available yet.</p>
                   <p className="text-sm mt-1">Start the test to visualize performance.</p>
                 </div>
               )}
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
