import React, { useState, useEffect } from 'react';
import { useWorkflowEditorStore } from '../../store/useWorkflowEditorStore';
import { getNodeDefinition } from '../../nodes/nodeDefinitions';
import {
  InputField,
  SelectField,
  TextAreaField,
  CodeField,
} from './FormControls';
import { X, Trash2, Sliders, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const NodeConfigPanel = () => {
  const { nodes, selectedNodeId, selectNode, updateNodeData, deleteNode } =
    useWorkflowEditorStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const [label, setLabel] = useState('');
  const [configValues, setConfigValues] = useState({});

  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data || {};
      setLabel(data.label || '');
      setConfigValues(data.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.data?.nodeType || 'manual';
  const def = getNodeDefinition(nodeType);
  const schema = def.configSchema || [];

  const handleFieldChange = (fieldName, newValue) => {
    const updated = { ...configValues, [fieldName]: newValue };
    setConfigValues(updated);
    updateNodeData(selectedNode.id, { label }, updated);
  };

  const handleLabelChange = (newLabel) => {
    setLabel(newLabel);
    updateNodeData(selectedNode.id, { label: newLabel }, configValues);
  };

  // Validation Check
  const missingFields = schema.filter(
    (field) => field.required && (!configValues[field.name] || configValues[field.name].toString().trim() === '')
  );
  const isValid = missingFields.length === 0;

  return (
    <aside className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col min-h-[calc(100vh-4rem)] p-5 backdrop-blur-md shrink-0 shadow-2xl z-20">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${def.color} shrink-0`}>
            <def.icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{def.label}</h3>
            <p className="text-[10px] text-slate-400 font-mono">ID: {selectedNode.id}</p>
          </div>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Validation Banner */}
      {!isValid ? (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Fill in all required fields to complete configuration.</span>
        </div>
      ) : (
        <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Node configuration complete & valid</span>
        </div>
      )}

      {/* Inputs Scrollable Area */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        
        {/* Node Custom Title */}
        <div className="space-y-1.5 pb-3 border-b border-slate-800/80">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Node Title
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Schema-Driven Dynamic Fields */}
        {schema.map((field) => {
          const val = configValues[field.name] !== undefined ? configValues[field.name] : '';

          if (field.type === 'select') {
            return (
              <SelectField
                key={field.name}
                label={field.label}
                value={val}
                options={field.options}
                required={field.required}
                helpText={field.helpText}
                onChange={(newVal) => handleFieldChange(field.name, newVal)}
              />
            );
          }

          if (field.type === 'textarea') {
            return (
              <TextAreaField
                key={field.name}
                label={field.label}
                value={val}
                placeholder={field.placeholder}
                required={field.required}
                helpText={field.helpText}
                onChange={(newVal) => handleFieldChange(field.name, newVal)}
              />
            );
          }

          if (field.type === 'code') {
            return (
              <CodeField
                key={field.name}
                label={field.label}
                value={val}
                placeholder={field.placeholder}
                required={field.required}
                helpText={field.helpText}
                onChange={(newVal) => handleFieldChange(field.name, newVal)}
              />
            );
          }

          return (
            <InputField
              key={field.name}
              label={field.label}
              type={field.type === 'number' ? 'number' : 'text'}
              value={val}
              placeholder={field.placeholder}
              required={field.required}
              helpText={field.helpText}
              onChange={(newVal) => handleFieldChange(field.name, newVal)}
            />
          );
        })}

      </div>

      {/* Footer Delete Button */}
      <div className="pt-4 border-t border-slate-800 mt-4">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>
      </div>

    </aside>
  );
};
