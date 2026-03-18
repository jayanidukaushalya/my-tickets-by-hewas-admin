import { shortenFileName } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Cancel01Icon,
  CloudUploadIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useId, useState } from "react"
import { Button } from "./ui/button"

type ExistingImageRef = {
  id: string
  url: string
  name: string
  size: number
}

interface FileWithPreview {
  file?: File
  existing?: ExistingImageRef
  preview: string
  id: string
}

interface FileUploaderProps {
  value?: Array<File | ExistingImageRef>
  onChange: (files: Array<File | ExistingImageRef>) => void
  maxFiles?: number
  accept?: string
  maxSize?: number // in bytes
  className?: string
}

export function FileUploader({
  value = [],
  onChange,
  maxFiles = 10,
  accept = "image/jpeg,image/png,image/webp",
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
}: FileUploaderProps) {
  // Generate unique ID for this instance
  const inputId = useId()

  const [files, setFiles] = useState<Array<FileWithPreview>>(() =>
    value.map((item) => {
      const id = Math.random().toString(36).substring(7)
      if (item instanceof File) {
        return {
          file: item,
          preview: URL.createObjectURL(item),
          id,
        }
      }
      return {
        existing: item,
        preview: item.url,
        id,
      }
    })
  )
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync internal state when value prop changes (for form reset)
  useEffect(() => {
    const newFiles = value.map((item) => {
      const id = Math.random().toString(36).substring(7)
      if (item instanceof File) {
        return {
          file: item,
          preview: URL.createObjectURL(item),
          id,
        }
      }
      return {
        existing: item,
        preview: item.url,
        id,
      }
    })
    setFiles(newFiles)
  }, [value])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      setError(null)

      // Check max files
      if (files.length + selectedFiles.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} file(s)`)
        return
      }

      // Validate files
      const invalidFiles = selectedFiles.filter((file) => file.size > maxSize)
      if (invalidFiles.length > 0) {
        setError(
          `Some files are too large. Max size is ${maxSize / 1024 / 1024}MB`
        )
        return
      }

      const newFiles: Array<FileWithPreview> = selectedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      }))

      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      onChange(
        updatedFiles.map((f) =>
          f.file ? f.file : (f.existing as ExistingImageRef)
        )
      )

      // Reset input
      e.target.value = ""
    },
    [files, maxFiles, maxSize, onChange]
  )

  // Process files helper (shared between input change and drag-drop)
  const processFiles = useCallback(
    (selectedFiles: Array<File>) => {
      setError(null)

      // Check max files
      if (files.length + selectedFiles.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} file(s)`)
        return
      }

      // Filter by accepted types
      const acceptedTypes = accept.split(",").map((t) => t.trim())
      const invalidTypeFiles = selectedFiles.filter(
        (file) =>
          !acceptedTypes.some((type) =>
            file.type.match(type.replace("*", ".*"))
          )
      )
      if (invalidTypeFiles.length > 0) {
        setError("Some files have invalid file types")
        return
      }

      // Validate file sizes
      const invalidFiles = selectedFiles.filter((file) => file.size > maxSize)
      if (invalidFiles.length > 0) {
        setError(
          `Some files are too large. Max size is ${maxSize / 1024 / 1024}MB`
        )
        return
      }

      const newFiles: Array<FileWithPreview> = selectedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      }))

      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      onChange(
        updatedFiles.map((f) =>
          f.file ? f.file : (f.existing as ExistingImageRef)
        )
      )
    },
    [files, maxFiles, maxSize, accept, onChange]
  )

  // Handle drag over the dropzone (for file drop)
  const handleDropzoneDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer.types.includes("Files")) {
        setIsDraggingOver(true)
      }
    },
    []
  )

  // Handle drag leave the dropzone
  const handleDropzoneDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDraggingOver(false)
    },
    []
  )

  // Handle file drop on the dropzone
  const handleDropzoneFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDraggingOver(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles)
      }
    },
    [processFiles]
  )

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((f) => f.id !== id)
      // Revoke the preview URL to free up memory
      const fileToRemove = files.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      setFiles(updatedFiles)
      onChange(
        updatedFiles.map((f) =>
          f.file ? f.file : (f.existing as ExistingImageRef)
        )
      )
      setError(null)
    },
    [files, onChange]
  )

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    setDraggedId(files[index]?.id ?? null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newFiles = [...files]
    const draggedFile = newFiles[draggedIndex]
    newFiles.splice(draggedIndex, 1)
    newFiles.splice(index, 0, draggedFile)

    setFiles(newFiles)
    setDraggedIndex(index)
    onChange(
      newFiles.map((f) => (f.file ? f.file : (f.existing as ExistingImageRef)))
    )
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDraggedId(null)
  }

  const canAddMore = files.length < maxFiles

  return (
    <div
      className={cn("space-y-4", className)}
      onDrop={() => {
        setDraggedIndex(null)
        setDraggedId(null)
      }}
    >
      {/* Upload Button */}
      {canAddMore && (
        <div
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onDrop={handleDropzoneFileDrop}
        >
          <label htmlFor={inputId} className="cursor-pointer">
            <div
              className={cn(
                "flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                isDraggingOver
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <div className="text-center">
                <HugeiconsIcon
                  icon={CloudUploadIcon}
                  className={cn(
                    "mx-auto mb-2 size-8 transition-colors",
                    isDraggingOver ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <p
                  className={cn(
                    "text-sm transition-colors",
                    isDraggingOver
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {isDraggingOver
                    ? "Drop files here"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {maxFiles === 1
                    ? "Single file only"
                    : `Up to ${maxFiles} files`}{" "}
                  (Max {maxSize / 1024 / 1024}MB each)
                </p>
              </div>
            </div>
          </label>
          <input
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            multiple={maxFiles > 1}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.length > 1 && (
            <p className="text-sm font-medium">{files.length} files uploaded</p>
          )}
          <div className="grid gap-2">
            {files.map((fileWithPreview, index) => (
              <div
                key={fileWithPreview.id}
                draggable={maxFiles > 1}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-card p-3",
                  maxFiles > 1 && "cursor-move",
                  draggedId === fileWithPreview.id && "opacity-50"
                )}
              >
                {/* Drag Handle */}
                {maxFiles > 1 && (
                  <HugeiconsIcon
                    icon={Menu01Icon}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                )}

                {/* Image Preview */}
                <div className="relative shrink-0">
                  <img
                    src={fileWithPreview.preview}
                    alt={
                      fileWithPreview.file?.name ||
                      fileWithPreview.existing?.name ||
                      "image"
                    }
                    className="h-16 w-16 rounded object-cover"
                  />
                  {index === 0 && files.length > 1 && (
                    <span className="absolute -top-1 -left-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                      Main
                    </span>
                  )}
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    title={
                      fileWithPreview.file?.name ||
                      fileWithPreview.existing?.name
                    }
                  >
                    {shortenFileName(
                      fileWithPreview.file?.name ||
                        fileWithPreview.existing?.name ||
                        "image",
                      30
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(
                      ((fileWithPreview.file?.size ??
                        fileWithPreview.existing?.size) ||
                        0) /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFile(fileWithPreview.id)}
                  className="shrink-0"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
