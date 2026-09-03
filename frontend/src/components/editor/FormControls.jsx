import React from 'react';
import { AlertCircle } from 'lucide-react';

export const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  helpText = '',
  error = '',
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          {label} {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
        {required && !value && (
          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Required
          </span>
        )}
      </div>
      
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-slate-950/80 border rounded-xl text-slate-100 text-xs font-mono focus:outline-none transition-all ${
          error || (required && !value)
            ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
            : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
        }`}
      />

      {helpText && <p className="text-[10px] text-slate-500">{helpText}</p>}
      {error && <p className="text-[10px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
};

export const SelectField = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  helpText = '',
}) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
        {label} {required && <span className="text-rose-400 font-bold">*</span>}
      </label>
      
      <select
        value={value || (options[0] || '')}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-900 text-slate-100">
            {opt}
          </option>
        ))}
      </select>

      {helpText && <p className="text-[10px] text-slate-500">{helpText}</p>}
    </div>
  );
};

export const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3,
  required = false,
  helpText = '',
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          {label} {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
        {required && !value && (
          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Required
          </span>
        )}
      </div>

      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 bg-slate-950/80 border rounded-xl text-slate-100 text-xs focus:outline-none transition-all resize-none ${
          required && !value
            ? 'border-rose-500/60 focus:border-rose-500'
            : 'border-slate-800 focus:border-indigo-500'
        }`}
      />

      {helpText && <p className="text-[10px] text-slate-500">{helpText}</p>}
    </div>
  );
};

export const CodeField = ({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false,
  helpText = '',
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          {label} {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
        {required && !value && (
          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Required
          </span>
        )}
      </div>

      <div className="relative">
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-indigo-300 font-mono text-[11px] leading-relaxed focus:outline-none transition-all resize-y ${
            required && !value
              ? 'border-rose-500/60 focus:border-rose-500'
              : 'border-slate-800 focus:border-indigo-500'
          }`}
        />
      </div>

      {helpText && <p className="text-[10px] text-slate-500">{helpText}</p>}
    </div>
  );
};
