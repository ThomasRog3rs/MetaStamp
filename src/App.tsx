import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import exifr from "exifr";
import JSZip from "jszip";
import { Lightbox, type LightboxImage } from "./components/Lightbox";
import { SettingsPanel } from "./components/SettingsPanel";
import type { ImageConfig } from "./types/config";
import { DEFAULT_CONFIG } from "./types/config";
import { loadConfig, debouncedSaveConfig } from "./utils/configStorage";
import { formatDate } from "./utils/formatPresets";

interface ProcessedImage {
  id: string;
  originalName: string;
  processedUrl: string;
  timestamp: string;
  usedFallback: boolean;
  status: "processing" | "done" | "error";
}

async function extractImageMetadata(
  file: File
): Promise<{ date: Date | null; usedFallback: boolean }> {
  try {
    const exifData = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });

    if (exifData?.DateTimeOriginal) {
      return { date: new Date(exifData.DateTimeOriginal), usedFallback: false };
    }
    if (exifData?.CreateDate) {
      return { date: new Date(exifData.CreateDate), usedFallback: false };
    }
    if (exifData?.ModifyDate) {
      return { date: new Date(exifData.ModifyDate), usedFallback: false };
    }
  } catch (error) {
    console.warn("Error extracting EXIF data:", error);
  }

  return { date: new Date(), usedFallback: true };
}

async function processImage(
  file: File,
  config: ImageConfig
): Promise<{ url: string; timestamp: string; usedFallback: boolean }> {
  return new Promise(async (resolve, reject) => {
    const { date, usedFallback } = await extractImageMetadata(file);
    const timestamp = formatDate(date || new Date(), config.dateFormat);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Calculate font size relative to image size
      const relativeFontSize = Math.max(
        Math.min(config.fontSize, img.width / 10),
        24
      );

      // Set up text styling with configurable font family
      ctx.font = `bold ${relativeFontSize}px "${config.fontFamily}", system-ui, sans-serif`;
      ctx.textBaseline = "bottom";

      // Calculate text position
      const textMetrics = ctx.measureText(timestamp);
      let x: number, y: number;

      switch (config.position) {
        case "bottomRight":
          x = img.width - textMetrics.width - config.offsetX;
          y = img.height - config.offsetY;
          break;
        case "bottomLeft":
          x = config.offsetX;
          y = img.height - config.offsetY;
          break;
        case "topRight":
          x = img.width - textMetrics.width - config.offsetX;
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

      // Convert to blob URL
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              url: URL.createObjectURL(blob),
              timestamp,
              usedFallback,
            });
          } else {
            reject(new Error("Could not create blob from canvas"));
          }
        },
        "image/png",
        0.95
      );
    };

    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState<ImageConfig>(DEFAULT_CONFIG);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const resultsSectionRef = useRef<HTMLElement | null>(null);
  const prevProcessingRef = useRef<boolean>(false);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = loadConfig();
    setConfig(savedConfig);
  }, []);

  // Save config to localStorage when it changes
  const handleConfigChange = useCallback((newConfig: ImageConfig) => {
    setConfig(newConfig);
    debouncedSaveConfig(newConfig);
  }, []);

  const handleResetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    debouncedSaveConfig(DEFAULT_CONFIG);
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) return;

    setIsProcessing(true);

    // Add files as processing
    const newImages: ProcessedImage[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalName: file.name,
      processedUrl: "",
      timestamp: "",
      usedFallback: false,
      status: "processing" as const,
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Process each file with current config
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const imageId = newImages[i].id;

      try {
        const result = await processImage(file, config);
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  processedUrl: result.url,
                  timestamp: result.timestamp,
                  usedFallback: result.usedFallback,
                  status: "done" as const,
                }
              : img
          )
        );
      } catch (error) {
        console.error("Error processing image:", error);
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: "error" as const } : img
          )
        );
      }
    }

    setIsProcessing(false);
  }, [config]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const handleDownloadSingle = useCallback((image: ProcessedImage) => {
    const link = document.createElement("a");
    link.href = image.processedUrl;
    link.download = `stamped_${image.originalName.replace(/\.[^/.]+$/, "")}.png`;
    link.click();
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const doneImages = images.filter((img) => img.status === "done");
    if (doneImages.length === 0) return;

    if (doneImages.length === 1) {
      handleDownloadSingle(doneImages[0]);
      return;
    }

    const zip = new JSZip();

    for (const image of doneImages) {
      const response = await fetch(image.processedUrl);
      const blob = await response.blob();
      const filename = `stamped_${image.originalName.replace(/\.[^/.]+$/, "")}.png`;
      zip.file(filename, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "metastamp_images.zip";
    link.click();
  }, [images, handleDownloadSingle]);

  const handleClearAll = useCallback(() => {
    images.forEach((img) => {
      if (img.processedUrl) {
        URL.revokeObjectURL(img.processedUrl);
      }
    });
    setImages([]);
    setLightboxOpen(false);
  }, [images]);

  const doneImages = images.filter((img) => img.status === "done");
  const doneImagesInGridOrder = useMemo(
    () => images.filter((img) => img.status === "done"),
    [images]
  );
  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      doneImagesInGridOrder.map((img) => ({
        src: img.processedUrl,
        alt: img.originalName,
        subtitle: img.timestamp,
        downloadName: `stamped_${img.originalName.replace(/\.[^/.]+$/, "")}.png`,
      })),
    [doneImagesInGridOrder]
  );

  const openLightboxForId = useCallback(
    (imageId: string) => {
      const idx = doneImagesInGridOrder.findIndex((img) => img.id === imageId);
      if (idx < 0) return;
      setLightboxIndex(idx);
      setLightboxOpen(true);
    },
    [doneImagesInGridOrder]
  );

  const handleLightboxDownload = useCallback(
    (image: LightboxImage) => {
      const link = document.createElement("a");
      link.href = image.src;
      link.download = image.downloadName || "image";
      link.click();
    },
    []
  );

  // If the list changes while open (e.g. clear all), keep state consistent.
  useEffect(() => {
    if (!lightboxOpen) return;
    if (lightboxImages.length === 0) setLightboxOpen(false);
    if (lightboxIndex >= lightboxImages.length) {
      setLightboxIndex(Math.max(0, lightboxImages.length - 1));
    }
  }, [lightboxOpen, lightboxImages.length, lightboxIndex]);

  useEffect(() => {
    if (!resultsSectionRef.current) return;
    if (prevProcessingRef.current && !isProcessing && doneImages.length > 0) {
      resultsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevProcessingRef.current = isProcessing;
  }, [isProcessing, doneImages.length]);
  const processingCount = images.filter(
    (img) => img.status === "processing"
  ).length;

  return (
    <div className="min-h-screen pb-16">
      {/* Settings Panel */}
      <SettingsPanel
        config={config}
        onChange={handleConfigChange}
        onReset={handleResetConfig}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <Lightbox
        open={lightboxOpen}
        images={lightboxImages}
        startIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onDownload={handleLightboxDownload}
      />

      {/* Header */}
      <header className="pt-8 pb-8 sm:pt-12 sm:pb-10 md:pt-16 md:pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 animate-fade-in">
            <div className="relative">
              <span className="text-5xl sm:text-6xl animate-float">📷</span>
              <div className="absolute inset-0 blur-xl opacity-50 bg-gradient-to-r from-purple-400 to-blue-500 -z-10" />
            </div>
            <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl gradient-text tracking-tight">
              MetaStamp
            </h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto text-balance leading-relaxed">
            Add beautiful date and time stamps to your photos instantly. All
            processing happens in your browser — your images never leave your
            device.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4">
        <div className="max-w-5xl mx-auto">
          {/* Customize Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-xl text-purple-700 font-semibold hover:border-purple-400 hover:bg-white hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Customize Overlay
            </button>
          </div>

          {/* Drop Zone */}
          <div
            className={`drop-zone ${isDragging ? "dragging" : ""} cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="py-20 px-8 md:py-28 md:px-16 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="mb-8">
                <div className="upload-icon-container">
                  <div
                    className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 shadow-lg transition-transform ${isDragging ? "animate-bounce-subtle scale-110" : ""}`}
                  >
                    <svg
                      className="w-12 h-12 text-white drop-shadow-lg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                {isDragging
                  ? "Drop your images here!"
                  : "Upload Files"}
              </h2>
              <p className="text-lg text-slate-500 mb-6">
                {isDragging
                  ? "Release to start processing"
                  : "Click to upload a file or drag and drop"}
              </p>
              <p className="text-sm text-slate-400 font-medium">
                JPEG, PNG, WebP • Multiple files supported
              </p>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-6 text-center">
            <div className="info-badge text-sm text-slate-700">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
              Current date/time will be used if EXIF metadata is missing
            </div>
          </div>

          {/* Processing Indicator */}
          {processingCount > 0 && (
            <div className="mt-10 text-center animate-fade-in">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200">
                <div className="spinner" />
                <span className="text-purple-700 font-semibold text-lg">
                  Processing {processingCount} image
                  {processingCount > 1 ? "s" : ""}...
                </span>
              </div>
            </div>
          )}

          {/* Results Section */}
          {images.length > 0 && (
            <section ref={resultsSectionRef} className="mt-16 animate-fade-in">
              {/* Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h3 className="text-2xl font-bold gradient-text">
                  Processed Images
                  {doneImages.length > 0 && (
                    <span className="ml-3 text-base font-semibold text-slate-500">
                      ({doneImages.length} ready)
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                  <button onClick={handleClearAll} className="btn-secondary">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Clear All
                  </button>
                  {doneImages.length > 0 && (
                    <button onClick={handleDownloadAll} className="btn-primary">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download All{" "}
                      {doneImages.length > 1 ? `(${doneImages.length})` : ""}
                    </button>
                  )}
                </div>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="image-card group animate-slide-up"
                    role={image.status === "done" ? "button" : undefined}
                    tabIndex={image.status === "done" ? 0 : -1}
                    aria-label={
                      image.status === "done"
                        ? `Preview ${image.originalName}`
                        : undefined
                    }
                    onKeyDown={(e) => {
                      if (image.status !== "done") return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLightboxForId(image.id);
                      }
                    }}
                    onClick={() => {
                      if (image.status !== "done") return;
                      openLightboxForId(image.id);
                    }}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {image.status === "processing" ? (
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="spinner mx-auto mb-3" />
                          <p className="text-sm text-purple-600 font-medium">Processing...</p>
                        </div>
                      </div>
                    ) : image.status === "error" ? (
                      <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                        <div className="text-center px-4">
                          <svg
                            className="w-10 h-10 text-red-500 mx-auto mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <p className="text-sm text-red-600 font-medium">
                            Failed to process
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="aspect-[4/3] overflow-hidden rounded-t-2xl">
                          <img
                            src={image.processedUrl}
                            alt={image.originalName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Overlay Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-end justify-between">
                            <div className="text-white">
                              <p className="text-sm font-medium truncate max-w-[180px]">
                                {image.originalName}
                              </p>
                              <p className="text-xs text-white/80 flex items-center gap-1">
                                {image.usedFallback && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                                )}
                                {image.timestamp}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadSingle(image);
                              }}
                              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition-all hover:scale-110"
                              title="Download"
                            >
                              <svg
                                className="w-5 h-5 text-white drop-shadow"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Fallback indicator */}
                    {image.status === "done" && image.usedFallback && (
                      <div className="absolute top-4 right-4 z-10">
                        <div
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center shadow-lg"
                          title="Using current date/time (no EXIF data found)"
                        >
                          <svg
                            className="w-5 h-5 text-white drop-shadow"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              {images.some((img) => img.usedFallback) && (
                <div className="mt-8 text-center">
                  <div className="info-badge text-sm text-slate-600">
                    <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-rose-400" />
                    Images marked used current date/time (no EXIF data found)
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-10 border-t border-purple-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-base font-semibold text-slate-700">
              100% Private & Secure
            </p>
          </div>
          <p className="text-sm text-slate-500">
            All processing happens locally in your browser. Your images are
            never uploaded to any server.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
