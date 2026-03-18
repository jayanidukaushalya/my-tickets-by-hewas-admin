import sharp from "sharp"
import type { UploadOptions, UploadResult } from "./client"
import { deleteFromR2ByUrl, uploadToR2 } from "./client"

export interface ProcessImageOptions {
  width?: number
  height?: number
  quality?: number
  fit?: "cover" | "contain" | "fill" | "inside" | "outside"
  format?: "webp" | "jpeg" | "png" | "avif"
}

export interface ImageUploadResult extends UploadResult {
  filename: string
  width?: number
  height?: number
}

export function generateUniqueFilename(
  originalName: string,
  extension: string = "webp"
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .substring(0, 50)

  return `${sanitizedName}-${timestamp}-${random}.${extension}`
}

export async function processImage(
  input: File | Buffer,
  options: ProcessImageOptions = {}
): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> {
  const {
    width,
    height,
    quality = 80,
    fit = "cover",
    format = "webp",
  } = options
  const buffer =
    input instanceof File ? Buffer.from(await input.arrayBuffer()) : input

  let sharpInstance = sharp(buffer)
  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit,
      withoutEnlargement: true,
    })
  }

  let outputBuffer: Buffer
  let metadata: sharp.OutputInfo

  switch (format) {
    case "jpeg":
      ;({ data: outputBuffer, info: metadata } = await sharpInstance
        .jpeg({ quality })
        .toBuffer({ resolveWithObject: true }))
      break
    case "png":
      ;({ data: outputBuffer, info: metadata } = await sharpInstance
        .png({ quality })
        .toBuffer({ resolveWithObject: true }))
      break
    case "avif":
      ;({ data: outputBuffer, info: metadata } = await sharpInstance
        .avif({ quality })
        .toBuffer({ resolveWithObject: true }))
      break
    case "webp":
    default:
      ;({ data: outputBuffer, info: metadata } = await sharpInstance
        .webp({ quality })
        .toBuffer({ resolveWithObject: true }))
  }

  return { buffer: outputBuffer, metadata }
}

function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    webp: "image/webp",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    avif: "image/avif",
  }
  return contentTypes[format] ?? "image/webp"
}

export async function uploadImage(
  file: File | Buffer,
  folder: string,
  options: ProcessImageOptions = {},
  uploadOptions: UploadOptions = {}
): Promise<ImageUploadResult> {
  const { format = "webp" } = options
  const originalName = file instanceof File ? file.name : "image"
  const filename = generateUniqueFilename(originalName, format)
  const key = `${folder.replace(/^\/|\/$/g, "")}/${filename}`

  const { buffer, metadata } = await processImage(file, options)

  const result = await uploadToR2(key, buffer, {
    ...uploadOptions,
    contentType: getContentType(format),
    cacheControl: "public, max-age=31536000, immutable",
  })

  return { ...result, filename, width: metadata.width, height: metadata.height }
}

export async function removeImageByUrl(url: string): Promise<void> {
  if (!url) return
  try {
    await deleteFromR2ByUrl(url)
  } catch {
    console.warn(`Failed to delete image from R2: ${url}`)
  }
}
