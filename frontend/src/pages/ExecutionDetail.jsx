import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { apiClient } from '../services/api';
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Layers,
  Code,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const ExecutionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [execution, setExecution] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    try {
      const res = await apiClient.get(`/executions/${id}`);
      if (res.data?.status === 'success' && res.data.execution) {
        const exec = res.data.execution;
        setExecution(exec);

        // Default selected step to first step or failed step
        if (!selectedStep && exec.steps && exec.steps.length > 0) {
          const failed = exec.steps.find((s) => s.status === 'failed');
          setSelectedStep(failed || exec.steps[0]);
        }
      } else {
        throw new Error('Execution not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch execution detail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // Real-time polling every 2 seconds until status is final
    const interval = setInterval(() => {
      if (execution?.status === 'queued' || execution?.status === 'running' || !execution) {
        fetchDetail();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [id, execution?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <h2 className="text-lg font-bold text-white">Execution Record Not Found</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={() => navigate('/executions')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold"
          >
            Back to Executions
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = execution.status === 'completed';
  const isFailed = execution.status === 'failed';
  const steps = execution.steps || [];

  const getStepDuration = (start, finish) => {
    if (!start || !finish) return '<10ms';
    const ms = new Date(finish) - new Date(start);
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      {/* Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/executions')}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold text-white">Execution Run Detail</h1>

              {isCompleted && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Success
                </span>
              )}
              {isFailed && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
              {(execution.status === 'queued' || execution.status === 'running') && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {execution.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {execution.id}</p>
          </div>
        </div>

        <button
          onClick={fetchDetail}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Step Execution Flow Sequence */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Execution Flow ({steps.length} Steps)
            </h3>
            <span className="text-xs text-slate-500">
              Total Duration: {getStepDuration(execution.started_at, execution.finished_at)}
            </span>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const stepSuccess = step.status === 'completed';
              const stepFail = step.status === 'failed';
              const isSelected = selectedStep?.id === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40 shadow-xl'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">
                          Node: {step.node_id}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {new Date(step.started_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {getStepDuration(step.started_at, step.finished_at)}
                      </span>
                      {stepSuccess && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {stepFail && (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  {step.error && (
                    <div className="mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-mono truncate">
                      {step.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Step Payload Inspector */}
        <div className="w-full md:w-1/2 p-6 bg-slate-950 overflow-y-auto space-y-5">
          {selectedStep ? (
            <>
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span>Step Payload Inspector ({selectedStep.node_id})</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Step ID: {selectedStep.id}</p>
              </div>

              {/* Error Callout if Failed */}
              {selectedStep.error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Step Failure Exception
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedStep.error}
                  </pre>
                </div>
              )}

              {/* Input Data Payload */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Input Data Payload
                </label>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-indigo-300 font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(selectedStep.input_data, null, 2)}</pre>
                </div>
              </div>

              {/* Output Data Payload */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Output Data Payload
                </label>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-emerald-300 font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(selectedStep.output_data, null, 2)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select a step on the left to inspect input and output data payloads.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
