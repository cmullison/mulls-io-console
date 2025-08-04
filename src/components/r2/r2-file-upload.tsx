"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { X, Upload, FileIcon } from "lucide-react";
import { toast } from "sonner";

interface R2FileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucketName: string;
  currentPath: string;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export function R2FileUpload({
  open,
  onOpenChange,
  bucketName,
  currentPath,
  onUploadComplete,
}: R2FileUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      addFiles(files);
    },
    []
  );

  const addFiles = (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }));

    setUploadFiles((prev) => [...prev, ...newUploadFiles]);
  };

  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (uploadFile: UploadFile, index: number) => {
    const { file } = uploadFile;
    const key = currentPath + file.name;

    setUploadFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f))
    );

    try {
      // For large files (>100MB), use multipart upload
      if (file.size > 100 * 1024 * 1024) {
        await uploadLargeFile(file, key, index);
      } else {
        await uploadSmallFile(file, key, index);
      }

      setUploadFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "completed", progress: 100 } : f
        )
      );
    } catch (error) {
      console.error("Upload error:", error);
      setUploadFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const uploadSmallFile = async (file: File, key: string, index: number) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", key);

    const xhr = new XMLHttpRequest();

    return new Promise<void>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress } : f))
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("POST", `/api/r2/buckets/${bucketName}/upload`);
      xhr.send(formData);
    });
  };

  const uploadLargeFile = async (file: File, key: string, index: number) => {
    // Create multipart upload
    const createResponse = await fetch(
      `/api/r2/buckets/${bucketName}/multipart/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          contentType: file.type,
        }),
      }
    );

    if (!createResponse.ok) {
      throw new Error("Failed to create multipart upload");
    }

    const { uploadId } = (await createResponse.json()) as { uploadId: string };
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const parts: { partNumber: number; etag: string }[] = [];

    // Upload chunks
    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("key", key);
      formData.append("partNumber", partNumber.toString());
      formData.append("chunk", chunk);

      const uploadResponse = await fetch(
        `/api/r2/buckets/${bucketName}/multipart/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload part ${partNumber}`);
      }

      const { etag } = (await uploadResponse.json()) as { etag: string };
      parts.push({ partNumber, etag });

      // Update progress
      const progress = (partNumber / totalChunks) * 100;
      setUploadFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress } : f))
      );
    }

    // Complete multipart upload
    const completeResponse = await fetch(
      `/api/r2/buckets/${bucketName}/multipart/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId,
          key,
          parts,
        }),
      }
    );

    if (!completeResponse.ok) {
      throw new Error("Failed to complete multipart upload");
    }
  };

  const startUpload = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pendingFiles = uploadFiles.filter((f) => f.status === "pending");

    // Upload files sequentially to avoid overwhelming the API
    for (let i = 0; i < uploadFiles.length; i++) {
      if (uploadFiles[i].status === "pending") {
        await uploadFile(uploadFiles[i], i);
      }
    }

    // Check if all uploads completed successfully
    const allCompleted = uploadFiles.every((f) => f.status === "completed");
    if (allCompleted) {
      toast.success("All files uploaded successfully");
      onUploadComplete();
      setTimeout(() => {
        onOpenChange(false);
        setUploadFiles([]);
      }, 1000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <Card
            className={`border-2 border-dashed p-8 text-center transition-colors relative ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Support for single and bulk uploads. Large files will use
                multipart upload.
              </p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </Card>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map((uploadFile, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      <span className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs capitalize">
                        {uploadFile.status}
                      </span>
                      {uploadFile.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {uploadFile.status === "uploading" && (
                    <Progress value={uploadFile.progress} className="h-2" />
                  )}

                  {uploadFile.error && (
                    <p className="text-xs text-destructive mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setUploadFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={startUpload}
              disabled={
                uploadFiles.length === 0 ||
                uploadFiles.some((f) => f.status === "uploading")
              }
            >
              Upload Files
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
