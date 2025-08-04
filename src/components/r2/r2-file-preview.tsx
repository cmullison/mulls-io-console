"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  FileAudioIcon,
  FileVideoIcon,
} from "lucide-react";
import { toast } from "sonner";

interface R2FilePreviewProps {
  file: {
    key: string;
    size?: number;
    lastModified?: Date;
    etag?: string;
  };
  bucketName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function R2FilePreview({
  file,
  bucketName,
  open,
  onOpenChange,
}: R2FilePreviewProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && file) {
      loadFilePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file]);

  const loadFilePreview = async () => {
    try {
      setLoading(true);
      const url = `/api/r2/buckets/${bucketName}/${file.key}`;
      setFileUrl(url);

      // Get file metadata first
      const headResponse = await fetch(url, { method: "HEAD" });
      if (headResponse.ok) {
        const type = headResponse.headers.get("content-type") || "";
        setContentType(type);

        // For text files, load content
        if (
          type.startsWith("text/") ||
          type === "application/json" ||
          type === "application/xml" ||
          file.key.endsWith(".md") ||
          file.key.endsWith(".txt") ||
          file.key.endsWith(".json") ||
          file.key.endsWith(".xml") ||
          file.key.endsWith(".yml") ||
          file.key.endsWith(".yaml")
        ) {
          const contentResponse = await fetch(url);
          if (contentResponse.ok) {
            const text = await contentResponse.text();
            setFileContent(text);
          }
        }
      }
    } catch (error) {
      console.error("Error loading file preview:", error);
      toast.error("Failed to load file preview");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (contentType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (
      contentType.startsWith("text/") ||
      contentType === "application/json" ||
      file.key.endsWith(".md") ||
      file.key.endsWith(".txt")
    ) {
      return <FileTextIcon className="h-5 w-5" />;
    } else if (contentType.startsWith("audio/")) {
      return <FileAudioIcon className="h-5 w-5" />;
    } else if (contentType.startsWith("video/")) {
      return <FileVideoIcon className="h-5 w-5" />;
    }
    return <FileIcon className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      );
    }

    // Image preview
    if (contentType.startsWith("image/")) {
      return (
        <div className="flex justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={file.key}
            className="max-w-full max-h-96 object-contain rounded-lg border"
            onError={() => {
              toast.error("Failed to load image");
            }}
          />
        </div>
      );
    }

    // Text content preview
    if (fileContent) {
      return (
        <div className="p-4">
          <Card className="p-4">
            <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96 font-mono">
              {fileContent}
            </pre>
          </Card>
        </div>
      );
    }

    // Audio preview
    if (contentType.startsWith("audio/")) {
      return (
        <div className="flex justify-center p-4">
          <audio controls className="w-full max-w-md">
            <source src={fileUrl} type={contentType} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Video preview
    if (contentType.startsWith("video/")) {
      return (
        <div className="flex justify-center p-4">
          <video controls className="max-w-full max-h-96 rounded-lg border">
            <source src={fileUrl} type={contentType} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    // PDF preview (basic)
    if (contentType === "application/pdf") {
      return (
        <div className="p-4">
          <Card className="p-4 text-center">
            <FileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              PDF preview not available. Click download to view the file.
            </p>
            <Button asChild>
              <a href={fileUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </Card>
        </div>
      );
    }

    // Default no preview available
    return (
      <div className="p-4">
        <Card className="p-4 text-center">
          <FileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Preview not available for this file type.
          </p>
          <Button asChild>
            <a href={fileUrl} download>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </a>
          </Button>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            {file.key.split("/").pop()}
          </DialogTitle>
        </DialogHeader>

        {/* File metadata */}
        <Card className="p-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Size:</span>
                <Badge variant="secondary">
                  {formatFileSize(file.size || 0)}
                </Badge>
              </div>

              {contentType && (
                <>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span>Type:</span>
                    <Badge variant="secondary">{contentType}</Badge>
                  </div>
                </>
              )}

              {file.lastModified && (
                <>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span>Modified:</span>
                    <Badge variant="secondary">
                      {new Date(file.lastModified).toLocaleDateString()}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={fileUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </Card>

        {/* File preview */}
        <div className="flex-1 overflow-auto">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  );
}
