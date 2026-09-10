import { useCallback, useState } from "react";
import { validateFile } from "@/utils/validation";

export interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "error";
  error?: string;
}

interface UseFileUploadOptions {
  acceptFormats: string[];
  maxFileSizeMB: number;
  maxFiles: number;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useFileUpload({ acceptFormats, maxFileSizeMB, maxFiles }: UseFileUploadOptions) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setGlobalError(null);
      const incomingArray = Array.from(incoming);

      setFiles((prev) => {
        const combinedCount = prev.length + incomingArray.length;
        if (combinedCount > maxFiles) {
          setGlobalError(
            maxFiles === 1
              ? "Only one file can be uploaded for this tool."
              : `You can upload up to ${maxFiles} files at a time.`
          );
        }

        const room = Math.max(0, maxFiles - prev.length);
        const accepted = incomingArray.slice(0, room).map((file) => {
          const result = validateFile(file, { acceptFormats, maxFileSizeMB });
          return {
            id: makeId(),
            file,
            status: result.valid ? "pending" : "error",
            error: result.error,
          } as UploadedFile;
        });

        return [...prev, ...accepted];
      });
    },
    [acceptFormats, maxFileSizeMB, maxFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setGlobalError(null);
  }, []);

  const hasValidFiles = files.some((f) => f.status === "pending");

  return { files, addFiles, removeFile, clearFiles, hasValidFiles, globalError };
}
