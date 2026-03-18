import {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_BUCKET_NAME,
  CLOUDFLARE_R2_PUBLIC_URL,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
} from "@/configs/env.config"
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl?: string
}

export function getR2Config(): R2Config {
  if (
    !CLOUDFLARE_ACCOUNT_ID ||
    !CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !CLOUDFLARE_R2_BUCKET_NAME
  ) {
    throw new Error("Missing Cloudflare R2 configuration.")
  }

  return {
    accountId: CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName: CLOUDFLARE_R2_BUCKET_NAME,
    publicUrl: CLOUDFLARE_R2_PUBLIC_URL || undefined,
  }
}

let r2Client: S3Client | null = null

export function getR2Client(): S3Client {
  if (!r2Client) {
    const config = getR2Config()
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }
  return r2Client
}

export interface UploadOptions {
  contentType?: string
  cacheControl?: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  key: string
  url: string
  size: number
  contentType: string
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const config = getR2Config()
  const client = getR2Client()

  const {
    contentType = "application/octet-stream",
    cacheControl = "public, max-age=31536000",
    metadata,
  } = options

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata,
    })
  )

  const size = typeof body === "string" ? Buffer.byteLength(body) : body.length

  const url = config.publicUrl
    ? `${config.publicUrl.replace(/\/$/, "")}/${key}`
    : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${key}`

  return { key, url, size, contentType }
}

export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null
  try {
    const config = getR2Config()
    if (config.publicUrl) {
      const baseUrl = config.publicUrl.replace(/\/$/, "")
      if (url.startsWith(baseUrl)) return url.slice(baseUrl.length + 1)
    }
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return pathname.startsWith("/") ? pathname.slice(1) : pathname
  } catch {
    return null
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const config = getR2Config()
  const client = getR2Client()
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucketName, Key: key })
  )
}

export async function deleteFromR2ByUrl(url: string): Promise<void> {
  const key = extractKeyFromUrl(url)
  if (key) await deleteFromR2(key)
}
