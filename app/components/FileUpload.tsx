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

  async function dateienVerarbeiten(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const dateien = Array.from(event.target.files || []);
    if (!dateien.length) return;

    setBusy(true);

    const neu: DateiEintrag[] = [];

    for (const datei of dateien) {
      const eintrag: DateiEintrag = {
        id: crypto.randomUUID(),
        name: datei.name,
        type: datei.type,
        size: datei.size,
      };

      if (
        datei.type.startsWith("image/") &&
        datei.size <= 4 * 1024 * 1024
      ) {
        eintrag.dataUrl = await zuDataUrl(datei);
      }

      neu.push(eintrag);
    }

    onChange([...value, ...neu]);
    event.target.value = "";
    setBusy(false);
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
          Fotos, PDF-Dateien und Nachweise auswählen oder hier ablegen
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

      {value.length > 0 && (
        <div className="bb-upload-list">
          {value.map((datei) => (
            <article key={datei.id} className="bb-upload-file">
              <div className="bb-upload-preview">
                {datei.dataUrl ? (
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
