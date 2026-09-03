import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getNodeDefinition } from '../../nodes/nodeDefinitions';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const CustomNode = memo(({ id, data, selected }) => {
  const nodeType = data.nodeType || 'manual';
  const def = getNodeDefinition(nodeType);
  const IconComponent = def.icon;
  const config = data.config || {};

  const isTrigger = def.category === 'Triggers';
  const isIfLogic = nodeType === 'if';

  // Check validation state (are required schema fields present?)
  const missingRequiredFields = (def.configSchema || []).filter(
    (field) => field.required && (!config[field.name] || config[field.name].toString().trim() === '')
  );
  const isValid = missingRequiredFields.length === 0;

  // Generate dynamic subtitle summary text
  const getSummary = () => {
    if (nodeType === 'webhook') return `${config.httpMethod || 'POST'} ${config.path || ''}`;
    if (nodeType === 'schedule') return `Interval: ${config.interval || '15_minutes'}`;
    if (nodeType === 'httpRequest') return `${config.method || 'GET'} ${config.url || ''}`;
    if (nodeType === 'email') return `To: ${config.to || 'not set'}`;
    if (nodeType === 'slack') return `Channel: ${config.channel || '#general'}`;
    if (nodeType === 'if') return `${config.field || 'field'} ${config.operator || 'equals'} ${config.value || ''}`;
    if (nodeType === 'switch') return `Field: ${config.field || ''}`;
    if (nodeType === 'delay') return `Wait ${config.duration || 5} ${config.unit || 'seconds'}`;
    if (nodeType === 'postgres') return config.query ? config.query.slice(0, 30) + '...' : 'SQL Query';
    if (nodeType === 'redis') return `${config.command || 'GET'} ${config.key || ''}`;
    if (nodeType === 'code') return 'JavaScript Function';
    return data.details || def.description;
  };

  return (
    <div
      className={`w-64 bg-slate-950/90 border-2 ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-2xl scale-102' : 'border-slate-800'
      } rounded-2xl p-4 shadow-xl transition-all relative group backdrop-blur-md`}
    >
      {/* Input Handle (Left) - Non-Triggers only */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="w-3.5! h-3.5! bg-indigo-500! border-2! border-slate-950! -left-[7px]! hover:scale-125 transition-transform"
        />
      )}

      {/* Node Header */}
      <div className="flex items-start space-x-3 mb-2">
        <div className={`p-2 rounded-xl border ${def.color} shrink-0`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white truncate">{data.label || def.label}</h4>
            {isValid ? (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Configured" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" title="Missing required settings" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
            {getSummary()}
          </p>
        </div>
      </div>

      {/* Footer Category Badge */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
        <span>{def.category}</span>
        {isValid ? (
          <span className="text-emerald-400 flex items-center gap-1 text-[9px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Validated
          </span>
        ) : (
          <span className="text-rose-400 flex items-center gap-1 text-[9px] font-bold">
            Needs Info
          </span>
        )}
      </div>

      {/* Output Handles (Right) */}
      {isIfLogic ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: '35%' }}
            className="w-3.5! h-3.5! bg-emerald-500! border-2! border-slate-950! -right-[7px]! hover:scale-125 transition-transform"
          />
          <span className="absolute right-3 top-[30%] text-[9px] font-bold text-emerald-400 pointer-events-none">
            True
          </span>

          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: '70%' }}
            className="w-3.5! h-3.5! bg-rose-500! border-2! border-slate-950! -right-[7px]! hover:scale-125 transition-transform"
          />
          <span className="absolute right-3 top-[65%] text-[9px] font-bold text-rose-400 pointer-events-none">
            False
          </span>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-3.5! h-3.5! bg-indigo-500! border-2! border-slate-950! -right-[7px]! hover:scale-125 transition-transform"
        />
      )}
    </div>
  );
});
