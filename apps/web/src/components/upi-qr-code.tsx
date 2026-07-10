"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";

export function UpiQrCode({
  paymentUri,
  label,
  size = 176,
}: {
  paymentUri: string;
  label: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    void QRCode.toCanvas(canvasRef.current, paymentUri, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });
  }, [paymentUri, size]);

  return (
    <div
      className="mx-auto rounded-xl border border-[#D7E0E8] bg-white p-2 shadow-sm"
      data-payment-uri={paymentUri}
      data-testid="upi-qr"
    >
      <canvas aria-label={label} ref={canvasRef} role="img" />
    </div>
  );
}
