"use client";

import { Photo } from "@/lib/types";
import { useEffect, useState } from "react";

export default function TestUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch photos on mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/photos");
      const data = await response.json();

      if (data.success) {
        setPhotos(data.photos);
      } else {
        console.error("Failed to fetch photos:", data.error);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setMessage(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a file first" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Photo uploaded successfully!",
        });
        // Clear selection
        setSelectedFile(null);
        setPreviewUrl(null);
        // Refresh photos list
        await fetchPhotos();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to upload photo",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
            Photo Upload Test
          </h1>
          <p className="mt-2 text-amber-800/80 dark:text-amber-200/80">
            Test uploading and displaying photos from Supabase
          </p>
        </header>

        {/* Upload Section */}
        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4">
            Upload Photo
          </h2>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2"
              >
                Select Image
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-sm text-amber-900 dark:text-amber-100
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-amber-100 dark:file:bg-zinc-700
                  file:text-amber-900 dark:file:text-amber-100
                  hover:file:bg-amber-200 dark:hover:file:bg-zinc-600
                  file:cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                  Preview
                </p>
                <div className="relative w-full max-w-md">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-lg border border-amber-200 dark:border-zinc-600 w-full h-auto max-h-64 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-2.5 rounded-lg font-semibold text-white
                bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </section>

        {/* Photos Display Section */}
        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4">
            Uploaded Photos ({photos.length})
          </h2>

          {loading && (
            <p className="text-amber-800/70 dark:text-amber-200/70">
              Loading photos...
            </p>
          )}

          {!loading && photos.length === 0 && (
            <p className="text-amber-800/70 dark:text-amber-200/70">
              No photos yet. Upload your first photo above!
            </p>
          )}

          {!loading && photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-lg bg-amber-50/80 dark:bg-zinc-700/80 border border-amber-100 dark:border-zinc-600 overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-square relative bg-amber-100 dark:bg-zinc-600">
                    <img
                      src={photo.url}
                      alt="Uploaded photo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EError%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="p-3 space-y-1">
                    <p className="text-xs text-amber-900/70 dark:text-amber-100/70">
                      <span className="font-semibold">URL:</span>{" "}
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 dark:text-amber-400 hover:underline break-all"
                      >
                        {photo.url.split("/").pop()}
                      </a>
                    </p>
                    <p className="text-xs text-amber-900/70 dark:text-amber-100/70">
                      <span className="font-semibold">Path:</span>{" "}
                      {photo.storage_path}
                    </p>
                    <p className="text-xs text-amber-900/70 dark:text-amber-100/70">
                      <span className="font-semibold">Uploaded:</span>{" "}
                      {new Date(photo.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-amber-600 dark:text-amber-400 hover:underline text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </main>
    </div>
  );
}
