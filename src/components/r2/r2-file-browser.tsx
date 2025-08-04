"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
// import { Badge } from '@/components/ui/badge';
import {
  FolderIcon,
  FileIcon,
  UploadIcon,
  PlusIcon,
  ArrowLeftIcon,
  DownloadIcon,
  TrashIcon,
  EyeIcon,
} from "lucide-react";
import { R2FileUpload } from "./r2-file-upload";
import { R2FilePreview } from "./r2-file-preview";
import { toast } from "sonner";
import { r2Config } from "@/lib/r2-config";
import { getAvailableBuckets } from "@/lib/r2-bindings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface R2Object {
  key: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
  isFolder?: boolean;
}

interface R2ListResponse {
  files: R2Object[];
  folders: R2Object[];
  truncated: boolean;
  error?: string;
}

interface R2FileBrowserProps {
  initialPath?: string;
  initialData?: R2ListResponse;
  initialBucket?: string;
}

export function R2FileBrowser({
  initialPath = "",
  initialData,
  initialBucket,
}: R2FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [currentBucket, setCurrentBucket] = useState(
    initialBucket || r2Config.defaultBucketName
  );
  const [objects, setObjects] = useState<R2Object[]>(
    initialData
      ? [...(initialData.folders || []), ...(initialData.files || [])]
      : []
  );
  const [loading, setLoading] = useState(!initialData);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<R2Object | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const availableBuckets = getAvailableBuckets();

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, currentBucket]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentPath) {
        params.set("prefix", currentPath);
      }
      params.set("delimiter", "/");

      const response = await fetch(
        `/api/r2/buckets/${currentBucket}?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to load files");
      }

      const data: R2ListResponse = await response.json();
      setObjects([...data.folders, ...data.files]);
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };

  const changeBucket = (bucket: string) => {
    setCurrentBucket(bucket);
    setCurrentPath(""); // Reset to root when changing buckets
  };

  const navigateUp = () => {
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    setCurrentPath(pathParts.join("/") + (pathParts.length > 0 ? "/" : ""));
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setCreatingFolder(true);
      const folderPath = currentPath + newFolderName;

      const response = await fetch(`/api/r2/buckets/${currentBucket}/folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: folderPath }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      setNewFolderName("");
      loadFiles();
      toast.success("Folder created successfully");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteFile = async (key: string) => {
    try {
      const response = await fetch(`/api/r2/buckets/${currentBucket}/${key}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      loadFiles();
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const pathSegments = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Bucket Selector & Breadcrumb Navigation */}
      <Card className="p-4 !border-none !bg-transparent !shadow-none">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={currentBucket} onValueChange={changeBucket}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableBuckets.map((bucket) => (
                  <SelectItem key={bucket} value={bucket}>
                    {bucket}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span>/</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToPath("")}
              className="p-1"
            >
              <FolderIcon className="h-4 w-4" />
            </Button>
            {pathSegments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <span>/</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigateToPath(
                      pathSegments.slice(0, index + 1).join("/") + "/"
                    )
                  }
                >
                  {segment}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {currentPath && (
              <Button variant="outline" size="sm" onClick={navigateUp}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-32"
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={createFolder}
                disabled={creatingFolder || !newFolderName.trim()}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      </Card>

      {/* File List */}
      <Card className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : objects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No files or folders found
          </div>
        ) : (
          <div className="space-y-2">
            {objects.map((object, index) => (
              <div
                key={object.key + index}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {object.isFolder ? (
                    <FolderIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-gray-500" />
                  )}

                  <div className="flex flex-col">
                    <button
                      className="text-left hover:underline"
                      onClick={() => {
                        if (object.isFolder) {
                          navigateToPath(object.key);
                        } else {
                          setPreviewFile(object);
                        }
                      }}
                    >
                      {object.isFolder
                        ? object.key.split("/").filter(Boolean).pop() + "/"
                        : object.key.split("/").pop()}
                    </button>

                    {!object.isFolder && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(object.size || 0)}</span>
                        {object.lastModified && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                              {new Date(
                                object.lastModified
                              ).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!object.isFolder && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewFile(object)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/api/r2/buckets/${currentBucket}/${object.key}`,
                          "_blank"
                        )
                      }
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFile(object.key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <R2FileUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        bucketName={currentBucket}
        currentPath={currentPath}
        onUploadComplete={loadFiles}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <R2FilePreview
          file={previewFile}
          bucketName={currentBucket}
          open={!!previewFile}
          onOpenChange={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
