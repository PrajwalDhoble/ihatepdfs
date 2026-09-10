import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import { useFileUpload } from "@/hooks/useFileUpload";
import { formatBytes } from "@/utils/validation";

interface ImageInfoToolProps {
  mode: "dimensions" | "format";
}

interface ImageInfo {
  width: number;
  height: number;
  detectedFormat: string;
  sizeBytes: number;
}

// Magic-byte signatures, checked client-side so this tool needs no server round-trip.
function detectFormatFromBytes(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "JPEG";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "PNG";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "WebP";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "GIF";
  return "Unknown (not a recognized image signature)";
}

export default function ImageInfoTool({ mode }: ImageInfoToolProps) {
  const { files, addFiles, removeFile, clearFiles, globalError } = useFileUpload({
    acceptFormats: ["jpg", "jpeg", "png", "webp"],
    maxFileSizeMB: 50,
    maxFiles: 1,
  });
  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File) {
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer.slice(0, 32));
      const detectedFormat = detectFormatFromBytes(bytes);

      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Couldn't read this image — it may be corrupted."));
        };
        img.src = url;
      });

      setInfo({ ...dimensions, detectedFormat, sizeBytes: file.size });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't analyze this image.");
    }
  }

  return (
    <div>
      <UploadZone
        files={files}
        acceptFormats={["jpg", "jpeg", "png", "webp"]}
        maxFiles={1}
        globalError={globalError}
        onFilesAdded={(incoming) => {
          addFiles(incoming);
          const file = Array.from(incoming)[0];
          if (file) analyze(file);
        }}
        onRemove={(id) => {
          removeFile(id);
          setInfo(null);
        }}
        onClear={() => {
          clearFiles();
          setInfo(null);
        }}
      />

      {error && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      {info && (
        <div
          style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-4)",
            background: "var(--color-bg-alt)",
            borderRadius: "var(--radius-md)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            fontSize: 14,
          }}
        >
          {mode === "dimensions" ? (
            <>
              <div>
                <strong>Width</strong>
                <div>{info.width}px</div>
              </div>
              <div>
                <strong>Height</strong>
                <div>{info.height}px</div>
              </div>
            </>
          ) : (
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Detected format</strong>
              <div>{info.detectedFormat}</div>
            </div>
          )}
          <div>
            <strong>File size</strong>
            <div>{formatBytes(info.sizeBytes)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
