import { useState, useCallback } from "react";
import type { ImageConfig, Position } from "../types/config";
import { FONT_OPTIONS } from "../types/config";
import { DATE_FORMAT_PRESETS, TIME_FORMAT_PRESETS, combineFormats, getPreviewTimestamp } from "../utils/formatPresets";
import { OverlayPreview } from "./OverlayPreview";

interface SettingsPanelProps {
  config: ImageConfig;
  onChange: (config: ImageConfig) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white/60 backdrop-blur-sm 
          rounded-xl border border-purple-200/50 hover:bg-white/80 hover:border-purple-300 
          transition-all shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 
            flex items-center justify-center shadow-sm">
            <span className="text-white">{icon}</span>
          </div>
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-purple-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 px-5 py-4 bg-white/40 backdrop-blur-sm rounded-xl border border-purple-100/50 space-y-4 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

function Slider({ label, value, onChange, min, max, step = 1, unit = "" }: SliderProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold font-mono text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full appearance-none cursor-pointer
          shadow-inner
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
          [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-blue-500
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
      />
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={value.startsWith("rgba") ? "#000000" : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl cursor-pointer border-2 border-purple-200 bg-white
            shadow-sm hover:shadow-md transition-shadow"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 px-3 py-2 text-xs font-mono bg-white border-2 border-purple-100 
            rounded-lg text-slate-700 focus:outline-none focus:border-purple-400 
            focus:ring-2 focus:ring-purple-200 transition-all shadow-sm"
        />
      </div>
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border-2 border-purple-100 rounded-xl 
          text-slate-700 text-sm font-medium shadow-sm
          focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200
          hover:border-purple-300 transition-all cursor-pointer
          [&>option]:bg-white [&>option]:text-slate-700"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const POSITION_OPTIONS: { value: Position; label: string; icon: string }[] = [
  { value: "topLeft", label: "Top Left", icon: "↖" },
  { value: "topRight", label: "Top Right", icon: "↗" },
  { value: "bottomLeft", label: "Bottom Left", icon: "↙" },
  { value: "bottomRight", label: "Bottom Right", icon: "↘" },
];

export function SettingsPanel({ config, onChange, onReset, isOpen, onClose }: SettingsPanelProps) {
  const updateConfig = useCallback(<K extends keyof ImageConfig>(key: K, value: ImageConfig[K]) => {
    const newConfig = { ...config, [key]: value };
    
    // Auto-update dateFormat when presets change and not using custom format
    if ((key === "dateFormatPreset" || key === "timeFormatPreset") && !config.useCustomFormat) {
      const datePreset = key === "dateFormatPreset" ? value as string : config.dateFormatPreset;
      const timePreset = key === "timeFormatPreset" ? value as string : config.timeFormatPreset;
      newConfig.dateFormat = combineFormats(datePreset, timePreset);
    }
    
    onChange(newConfig);
  }, [config, onChange]);
  
  const handleCustomFormatToggle = useCallback((useCustom: boolean) => {
    const newConfig = { ...config, useCustomFormat: useCustom };
    if (!useCustom) {
      // Reset to preset-based format
      newConfig.dateFormat = combineFormats(config.dateFormatPreset, config.timeFormatPreset);
    }
    onChange(newConfig);
  }, [config, onChange]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] z-50 
          transform transition-transform duration-300 ease-out overflow-hidden
          bg-gradient-to-br from-purple-50/95 via-white/95 to-blue-50/95 backdrop-blur-xl
          border-l-2 border-purple-200/50 shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b-2 border-purple-100/50 bg-white/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 
                  flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                    Customize Overlay
                  </h2>
                  <p className="text-sm text-slate-600">Adjust how your timestamp looks</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-xl bg-white/80 hover:bg-white border-2 border-purple-200 
                  hover:border-purple-300 flex items-center justify-center transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Preview */}
          <div className="px-6 py-5 border-b-2 border-purple-100/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30">
            <OverlayPreview config={config} />
          </div>
          
          {/* Settings Sections */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
            {/* Typography Section */}
            <Section
              title="Typography"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              }
            >
              <Select
                label="Font Family"
                value={config.fontFamily}
                onChange={(v) => updateConfig("fontFamily", v)}
                options={FONT_OPTIONS.map(f => ({ value: f.value, label: f.label }))}
              />
              <Slider
                label="Font Size"
                value={config.fontSize}
                onChange={(v) => updateConfig("fontSize", v)}
                min={24}
                max={200}
                unit="px"
              />
              <ColorPicker
                label="Font Color"
                value={config.fontColor}
                onChange={(v) => updateConfig("fontColor", v)}
              />
            </Section>
            
            {/* Stroke Section */}
            <Section
              title="Stroke / Outline"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              }
            >
              <Slider
                label="Stroke Width"
                value={config.strokeWidth}
                onChange={(v) => updateConfig("strokeWidth", v)}
                min={0}
                max={20}
                unit="px"
              />
              <ColorPicker
                label="Stroke Color"
                value={config.strokeColor}
                onChange={(v) => updateConfig("strokeColor", v)}
              />
            </Section>
            
            {/* Drop Shadow Section */}
            <Section
              title="Drop Shadow"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              defaultOpen={config.dropShadowEnabled}
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Enable Drop Shadow</label>
                <button
                  type="button"
                  onClick={() => updateConfig("dropShadowEnabled", !config.dropShadowEnabled)}
                  className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${
                    config.dropShadowEnabled 
                      ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                      : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${
                      config.dropShadowEnabled ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              
              {config.dropShadowEnabled && (
                <div className="space-y-4 pt-2 animate-fade-in">
                  <Slider
                    label="Blur"
                    value={config.dropShadowBlur}
                    onChange={(v) => updateConfig("dropShadowBlur", v)}
                    min={0}
                    max={30}
                    unit="px"
                  />
                  <Slider
                    label="Offset X"
                    value={config.dropShadowOffsetX}
                    onChange={(v) => updateConfig("dropShadowOffsetX", v)}
                    min={-20}
                    max={20}
                    unit="px"
                  />
                  <Slider
                    label="Offset Y"
                    value={config.dropShadowOffsetY}
                    onChange={(v) => updateConfig("dropShadowOffsetY", v)}
                    min={-20}
                    max={20}
                    unit="px"
                  />
                  <ColorPicker
                    label="Shadow Color"
                    value={config.dropShadowColor}
                    onChange={(v) => updateConfig("dropShadowColor", v)}
                  />
                </div>
              )}
            </Section>
            
            {/* Position Section */}
            <Section
              title="Position"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              }
            >
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-slate-700">Corner Position</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {POSITION_OPTIONS.map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => updateConfig("position", pos.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all font-medium ${
                        config.position === pos.value
                          ? "bg-gradient-to-r from-purple-100 to-blue-100 border-purple-400 text-purple-700 shadow-md"
                          : "bg-white border-purple-100 text-slate-600 hover:bg-purple-50 hover:border-purple-300 shadow-sm"
                      }`}
                    >
                      <span className="text-lg">{pos.icon}</span>
                      <span className="text-sm">{pos.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Slider
                label="Offset X"
                value={config.offsetX}
                onChange={(v) => updateConfig("offsetX", v)}
                min={0}
                max={100}
                unit="px"
              />
              <Slider
                label="Offset Y"
                value={config.offsetY}
                onChange={(v) => updateConfig("offsetY", v)}
                min={0}
                max={100}
                unit="px"
              />
            </Section>
            
            {/* Date & Time Section */}
            <Section
              title="Date & Time Format"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              {/* Custom format toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Use Custom Format</label>
                <button
                  type="button"
                  onClick={() => handleCustomFormatToggle(!config.useCustomFormat)}
                  className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${
                    config.useCustomFormat 
                      ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                      : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${
                      config.useCustomFormat ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              
              {config.useCustomFormat ? (
                <div className="space-y-2.5 animate-fade-in">
                  <label className="text-sm font-medium text-slate-700">Custom Format String</label>
                  <input
                    type="text"
                    value={config.dateFormat}
                    onChange={(e) => updateConfig("dateFormat", e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm:ss"
                    className="w-full px-4 py-2.5 bg-white border-2 border-purple-100 rounded-xl 
                      text-slate-700 text-sm font-mono shadow-sm
                      focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200
                      hover:border-purple-300 transition-all"
                  />
                  <p className="text-xs text-slate-500 bg-purple-50/50 rounded-lg px-3 py-2 border border-purple-100">
                    <span className="font-semibold text-purple-700">Tokens:</span> YYYY, MM, DD, HH, hh, mm, ss, A (AM/PM), MMM, MMMM
                  </p>
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 shadow-sm">
                    <p className="text-xs font-medium text-slate-600 mb-1">Preview:</p>
                    <p className="text-sm font-mono font-semibold text-purple-700">{getPreviewTimestamp(config.dateFormat)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <Select
                    label="Date Format"
                    value={config.dateFormatPreset}
                    onChange={(v) => updateConfig("dateFormatPreset", v)}
                    options={DATE_FORMAT_PRESETS.map(p => ({ value: p.value, label: p.label }))}
                  />
                  <Select
                    label="Time Format"
                    value={config.timeFormatPreset}
                    onChange={(v) => updateConfig("timeFormatPreset", v)}
                    options={TIME_FORMAT_PRESETS.map(p => ({ value: p.value, label: p.label }))}
                  />
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 shadow-sm">
                    <p className="text-xs font-medium text-slate-600 mb-1">Preview:</p>
                    <p className="text-sm font-mono font-semibold text-purple-700">
                      {getPreviewTimestamp(combineFormats(config.dateFormatPreset, config.timeFormatPreset))}
                    </p>
                  </div>
                </div>
              )}
            </Section>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-5 border-t-2 border-purple-100/50 bg-white/40 backdrop-blur-sm flex gap-3">
            <button
              onClick={onReset}
              className="flex-1 px-5 py-3 bg-white hover:bg-slate-50 border-2 border-purple-200 
                hover:border-purple-300 rounded-xl text-slate-700 font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl 
                text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/40 
                hover:-translate-y-0.5 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
