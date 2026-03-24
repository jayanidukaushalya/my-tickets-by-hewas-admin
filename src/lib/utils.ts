import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shortenFileName = (
  fileName: string,
  maxLength: number = 30
): string => {
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

export function formatEnum(val: string) {
  return val
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(numericAmount)) return "LKR 0.00"

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

export function getNumberFromParams(
  searchParams: URLSearchParams,
  key: string
) {
  const value = searchParams.get(key)
  if (value === null) return undefined

  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}
