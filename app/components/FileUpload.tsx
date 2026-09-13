"use client";

import { useState } from "react";
import Image from "next/image";

export type DateiEintrag = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
};

type Props = {
  value: DateiEintrag[];
  onChange: (files: DateiEintrag[]) => void;
};

export default function FileUpload({
  value,
  onChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");

  async function dateienVerarbeiten(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const dateien = Array.from(event.target.files || []);
    if (!dateien.length) return;

    setFehler("");
    if (dateien.some((datei) => !(datei.type.startsWith("image/") || datei.type === "application/pdf") || datei.size > 4 * 1024 * 1024)) {
      setFehler("Bitte nur Bilder oder PDF-Dateien bis 4 MB pro Datei auswählen.");
      event.target.value = "";
      return;
    }
    const input = event.target;
    setBusy(true);
    try {
      const neu: DateiEintrag[] = [];
      for (const datei of dateien) {
        neu.push({ id: crypto.randomUUID(), name: datei.name, type: datei.type, size: datei.size, dataUrl: await zuDataUrl(datei) });
      }
      onChange([...value, ...neu]);
    } catch {
      setFehler("Die Dateien konnten nicht gelesen werden. Bitte erneut auswählen.");
    } finally {
      input.value = "";
      setBusy(false);
    }
  }

  function entfernen(id: string) {
    onChange(value.filter((datei) => datei.id !== id));
  }

  return (
    <div className="bb-upload">
      <label className="bb-upload-dropzone">
        <span className="bb-upload-icon">⇧</span>
        <strong>
          {busy ? "Dateien werden vorbereitet …" : "Dateien hochladen"}
        </strong>
        <p>
          Fotos und PDF-Dateien auswählen (max. 4 MB pro Datei). Danach das Formular speichern.
        </p>
        <span className="bb-upload-button">Dateien auswählen</span>

        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={dateienVerarbeiten}
          disabled={busy}
        />
      </label>

      {fehler && <p role="alert" className="text-sm text-red-600">{fehler}</p>}

      {value.length > 0 && (
        <div className="bb-upload-list">
          {value.map((datei) => (
            <article key={datei.id} className="bb-upload-file">
              <div className="bb-upload-preview">
                {datei.dataUrl && datei.type.startsWith("image/") ? (
                  <Image
                    src={datei.dataUrl}
                    alt={datei.name}
                    width={160}
                    height={120}
                    unoptimized
                  />
                ) : (
                  <span>PDF</span>
                )}
              </div>

              <div className="bb-upload-info">
                <strong title={datei.name}>{datei.name}</strong>
                <span>{groesseFormatieren(datei.size)}</span>
                {datei.dataUrl ? (
                  <a href={datei.dataUrl} download={datei.name} className="text-sm underline">Herunterladen</a>
                ) : (
                  <span className="text-red-600">Dateiinhalt fehlt – bitte erneut hochladen.</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => entfernen(datei.id)}
                aria-label={`${datei.name} entfernen`}
              >
                ×
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function zuDataUrl(datei: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(datei);
  });
}

function groesseFormatieren(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
