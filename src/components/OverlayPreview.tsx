import { useEffect, useRef, useMemo } from "react";
import type { ImageConfig } from "../types/config";
import { formatDate } from "../utils/formatPresets";

interface OverlayPreviewProps {
  config: ImageConfig;
}

// Sample image - a simple gradient background that looks like a photo
const SAMPLE_IMAGE_WIDTH = 800;
const SAMPLE_IMAGE_HEIGHT = 600;

function createSampleImageCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_IMAGE_WIDTH;
  canvas.height = SAMPLE_IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  
  // Create a nice gradient background that simulates a landscape photo
  const gradient = ctx.createLinearGradient(0, 0, 0, SAMPLE_IMAGE_HEIGHT);
  gradient.addColorStop(0, "#1e3a5f");   // Dark blue sky
  gradient.addColorStop(0.4, "#3d6b8c"); // Lighter blue
  gradient.addColorStop(0.6, "#8fb4d0"); // Horizon
  gradient.addColorStop(0.65, "#c4d6a4"); // Green hills
  gradient.addColorStop(1, "#5a7247");    // Darker green
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SAMPLE_IMAGE_WIDTH, SAMPLE_IMAGE_HEIGHT);
  
  // Add some subtle "texture" - hills silhouette
  ctx.fillStyle = "#4a6337";
  ctx.beginPath();
  ctx.moveTo(0, SAMPLE_IMAGE_HEIGHT * 0.7);
  ctx.quadraticCurveTo(SAMPLE_IMAGE_WIDTH * 0.25, SAMPLE_IMAGE_HEIGHT * 0.55, SAMPLE_IMAGE_WIDTH * 0.5, SAMPLE_IMAGE_HEIGHT * 0.65);
  ctx.quadraticCurveTo(SAMPLE_IMAGE_WIDTH * 0.75, SAMPLE_IMAGE_HEIGHT * 0.75, SAMPLE_IMAGE_WIDTH, SAMPLE_IMAGE_HEIGHT * 0.6);
  ctx.lineTo(SAMPLE_IMAGE_WIDTH, SAMPLE_IMAGE_HEIGHT);
  ctx.lineTo(0, SAMPLE_IMAGE_HEIGHT);
  ctx.closePath();
  ctx.fill();
  
  // Add a "sun" glow effect
  const sunGradient = ctx.createRadialGradient(
    SAMPLE_IMAGE_WIDTH * 0.7, SAMPLE_IMAGE_HEIGHT * 0.35, 0,
    SAMPLE_IMAGE_WIDTH * 0.7, SAMPLE_IMAGE_HEIGHT * 0.35, 150
  );
  sunGradient.addColorStop(0, "rgba(255, 220, 150, 0.8)");
  sunGradient.addColorStop(0.3, "rgba(255, 200, 100, 0.3)");
  sunGradient.addColorStop(1, "rgba(255, 200, 100, 0)");
  ctx.fillStyle = sunGradient;
  ctx.fillRect(0, 0, SAMPLE_IMAGE_WIDTH, SAMPLE_IMAGE_HEIGHT);
  
  return canvas;
}

export function OverlayPreview({ config }: OverlayPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleImageRef = useRef<HTMLCanvasElement | null>(null);
  
  // Create sample image once
  const sampleImage = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!sampleImageRef.current) {
      sampleImageRef.current = createSampleImageCanvas();
    }
    return sampleImageRef.current;
  }, []);
  
  // Preview timestamp using current time
  const timestamp = useMemo(() => {
    return formatDate(new Date(), config.dateFormat);
  }, [config.dateFormat]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sampleImage) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear and draw sample image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sampleImage, 0, 0);
    
    // Calculate font size relative to image size (same logic as processImage)
    const relativeFontSize = Math.max(
      Math.min(config.fontSize, canvas.width / 10),
      24
    );
    
    // Set up text styling
    ctx.font = `bold ${relativeFontSize}px "${config.fontFamily}", system-ui, sans-serif`;
    ctx.textBaseline = "bottom";
    
    // Calculate text position
    const textMetrics = ctx.measureText(timestamp);
    let x: number, y: number;
    
    switch (config.position) {
      case "bottomRight":
        x = canvas.width - textMetrics.width - config.offsetX;
        y = canvas.height - config.offsetY;
        break;
      case "bottomLeft":
        x = config.offsetX;
        y = canvas.height - config.offsetY;
        break;
      case "topRight":
        x = canvas.width - textMetrics.width - config.offsetX;
        y = relativeFontSize + config.offsetY;
        break;
      case "topLeft":
        x = config.offsetX;
        y = relativeFontSize + config.offsetY;
        break;
    }
    
    // Apply drop shadow if enabled
    if (config.dropShadowEnabled) {
      ctx.shadowBlur = config.dropShadowBlur;
      ctx.shadowOffsetX = config.dropShadowOffsetX;
      ctx.shadowOffsetY = config.dropShadowOffsetY;
      ctx.shadowColor = config.dropShadowColor;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowColor = "transparent";
    }
    
    // Draw text stroke
    if (config.strokeWidth > 0) {
      ctx.strokeStyle = config.strokeColor;
      ctx.lineWidth = config.strokeWidth;
      ctx.lineJoin = "round";
      ctx.strokeText(timestamp, x, y);
    }
    
    // Reset shadow for fill (only apply shadow once)
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw text fill
    ctx.fillStyle = config.fontColor;
    ctx.fillText(timestamp, x, y);
    
  }, [config, timestamp, sampleImage]);
  
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-slate-900/50 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        width={SAMPLE_IMAGE_WIDTH}
        height={SAMPLE_IMAGE_HEIGHT}
        className="w-full h-auto"
        style={{ imageRendering: "auto" }}
      />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/60">
        <span>Preview</span>
        <span className="font-mono">{timestamp}</span>
      </div>
    </div>
  );
}
