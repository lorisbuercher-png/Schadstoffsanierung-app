"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
};

export default function SignaturePad({
  value = "",
  onChange,
  label = "Unterschrift",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!value) return;

    const bild = new Image();

    bild.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bild, 0, 0, canvas.width, canvas.height);
    };

    bild.src = value;
  }, [value]);

  function position(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) / rect.width) *
        canvas.width,
      y:
        ((event.clientY - rect.top) / rect.height) *
        canvas.height,
    };
  }

  function starten(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const punkt = position(event);

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#183f46";
    ctx.beginPath();
    ctx.moveTo(punkt.x, punkt.y);

    setDrawing(true);
  }

  function zeichnen(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (!drawing) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const punkt = position(event);
    ctx.lineTo(punkt.x, punkt.y);
    ctx.stroke();
  }

  function beenden() {
    if (!drawing) return;

    setDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    onChange(canvas.toDataURL("image/png"));
  }

  function loeschen() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    onChange("");
  }

  return (
    <div className="bb-signature">
      <div className="bb-signature-header">
        <label>{label}</label>

        <span className={value ? "signed" : ""}>
          <i />
          {value ? "Unterschrieben" : "Unterschrift offen"}
        </span>
      </div>

      <div className="bb-signature-canvas">
        <canvas
          ref={canvasRef}
          width={900}
          height={220}
          onPointerDown={starten}
          onPointerMove={zeichnen}
          onPointerUp={beenden}
          onPointerCancel={beenden}
          className="bb-signature-drawing"
        />

        {!value && !drawing && (
          <div className="bb-signature-placeholder">
            Hier mit Maus oder Finger unterschreiben
          </div>
        )}

        <div className="bb-signature-line" />
      </div>

      <button
        type="button"
        onClick={loeschen}
        className="bb-signature-clear"
      >
        Unterschrift löschen
      </button>
    </div>
  );
}
