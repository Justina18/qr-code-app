"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, Eye, EyeOff, MessageCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type ECLevel = "L" | "M" | "Q" | "H";

interface QRCodeGeneratorProps {
  defaultText?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  defaultText = "https://gravatar.com/ballwictb",
}) => {
  const [text, setText] = useState(defaultText);
  const [size, setSize] = useState(200);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showBgColor, setShowBgColor] = useState(true);
  const [level, setLevel] = useState<ECLevel>("M");

  const [copied, setCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);

  const [centerImageUrl, setCenterImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  const centerImgSize = useMemo(() => Math.round(size * 0.2), [size]);

  useEffect(() => {
    return () => {
      if (centerImageUrl?.startsWith("blob:")) URL.revokeObjectURL(centerImageUrl);
    };
  }, [centerImageUrl]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Failed to copy");
    }
  };

  const downloadPng = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) {
      console.error("QR canvas not found");
      return;
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    if (showBgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    ctx.drawImage(canvas, 0, 0);

    const finishDownload = () => {
      const url = exportCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    if (centerImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const s = exportCanvas.width;
        const imgS = Math.round(s * 0.2);
        const x = Math.round((s - imgS) / 2);
        const y = Math.round((s - imgS) / 2);

          ctx.save();
        ctx.beginPath();
        ctx.arc(x + imgS / 2, y + imgS / 2, imgS / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, imgS, imgS);
        ctx.restore();

        finishDownload();
      };
      img.onerror = () => finishDownload();
      img.src = centerImageUrl;
    } else {
      finishDownload();
    }
  };

  const shareWhatsApp = () => {
    const value = text?.trim() || defaultText;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(value)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const shareDiscord = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 1500);
    } catch {
      alert("Copy failed — please copy manually.");
    }
  };

  const onPickImage = () => fileInputRef.current?.click();

  const onImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (centerImageUrl?.startsWith("blob:")) URL.revokeObjectURL(centerImageUrl);

    const url = URL.createObjectURL(file);
    setCenterImageUrl(url);
  };

  const reset = () => {
    setText(defaultText);
    setSize(200);
    setFgColor("#000000");
    setBgColor("#ffffff");
    setShowBgColor(true);
    setLevel("M");

    if (centerImageUrl?.startsWith("blob:")) URL.revokeObjectURL(centerImageUrl);
    setCenterImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur sm:p-10">
        <h1 className="text-center text-2xl font-extrabold tracking-widest text-slate-800 sm:text-3xl">
          QR GENERATOR
        </h1>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">URL / Text</label>
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter URL or text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={copyText}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition hover:bg-slate-50"
                  title="Copy"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Size (px)</label>
                <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                  {size}
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={400}
                value={size}
                onChange={(e) => setSize(clamp(parseInt(e.target.value, 10), 100, 400))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">QR Color</label>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={!showBgColor}
                    className={`h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 ${
                      !showBgColor ? "opacity-50" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowBgColor((s) => !s)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition hover:bg-slate-50"
                    title={showBgColor ? "Hide background" : "Show background"}
                  >
                    {showBgColor ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Error Correction Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ECLevel)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Higher levels allow the QR to scan even if partly damaged.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Center Image (optional)
              </label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={onPickImage}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <ImageIcon className="h-5 w-5" />
                  {centerImageUrl ? "Change Image" : "Upload Image"}
                </button>

                {centerImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (centerImageUrl.startsWith("blob:")) URL.revokeObjectURL(centerImageUrl);
                      setCenterImageUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition hover:bg-slate-50"
                    title="Remove image"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border-4 border-blue-600 bg-slate-50 p-5 shadow-lg">
              <div
                ref={qrWrapRef}
                className="relative grid place-items-center rounded-2xl bg-white p-4"
                style={{ width: "fit-content", marginInline: "auto" }}
              >
                <QRCodeCanvas
                  value={text || defaultText}
                  size={size}
                  level={level}
                  fgColor={fgColor}
                  bgColor={showBgColor ? bgColor : "#00000000"}
                  includeMargin
                />

                {centerImageUrl && (
                  <img
                    src={centerImageUrl}
                    alt="Center"
                    className="absolute rounded-full border-4 border-white object-cover shadow-md"
                    style={{
                      width: centerImgSize,
                      height: centerImgSize,
                    }}
                  />
                )}
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={downloadPng}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download className="h-5 w-5" />
                  Download PNG
                </button>

                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-green-600"
                >
                  <MessageCircle className="h-5 w-5" />
                  Share on WhatsApp
                </button>

                <button
                  type="button"
                  onClick={shareDiscord}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  {discordCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  {discordCopied ? "Copied for Discord" : "Copy for Discord"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm font-semibold text-slate-600">&copy; {new Date().getFullYear()} Justina Igbani.</p>
        </footer>
      </div>
    </div>
  );
};

export default QRCodeGenerator;