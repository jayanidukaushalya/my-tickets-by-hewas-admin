import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shortenFileName = (fileName: string, maxLength: number = 30): string => {
  if (!fileName || fileName.length <= maxLength) return fileName
  const lastDotIndex = fileName.lastIndexOf(".")
  if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
    const extension = fileName.substring(lastDotIndex)
    const availableLength = maxLength - extension.length - 3
    if (availableLength > 0) {
      return fileName.substring(0, availableLength) + "..." + extension
    }
  }
  return fileName.substring(0, maxLength - 3) + "..."
}
