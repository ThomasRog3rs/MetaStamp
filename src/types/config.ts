export type Position = "bottomRight" | "bottomLeft" | "topRight" | "topLeft";

export interface ImageConfig {
  // Typography
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  
  // Stroke
  strokeColor: string;
  strokeWidth: number;
  
  // Position
  position: Position;
  offsetX: number;
  offsetY: number;
  
  // Drop Shadow
  dropShadowEnabled: boolean;
  dropShadowBlur: number;
  dropShadowOffsetX: number;
  dropShadowOffsetY: number;
  dropShadowColor: string;
  
  // Date/Time Format
  dateFormatPreset: string;
  timeFormatPreset: string;
  dateFormat: string; // Combined or custom format
  useCustomFormat: boolean;
}

export const DEFAULT_CONFIG: ImageConfig = {
  // Typography
  fontSize: 120,
  fontFamily: "Inter",
  fontColor: "#FBBF24",
  
  // Stroke
  strokeColor: "#000000",
  strokeWidth: 5,
  
  // Position
  position: "bottomRight",
  offsetX: 20,
  offsetY: 20,
  
  // Drop Shadow
  dropShadowEnabled: false,
  dropShadowBlur: 4,
  dropShadowOffsetX: 2,
  dropShadowOffsetY: 2,
  dropShadowColor: "rgba(0, 0, 0, 0.5)",
  
  // Date/Time Format
  dateFormatPreset: "YYYY-MM-DD",
  timeFormatPreset: "HH:mm:ss",
  dateFormat: "YYYY-MM-DD HH:mm:ss",
  useCustomFormat: false,
};

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Oswald", label: "Oswald" },
  { value: "Source Code Pro", label: "Source Code Pro" },
  { value: "system-ui", label: "System Default" },
] as const;
