import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize an Ethereum address to a checksummed form when possible.
// If ethers is available we use ethers.utils.getAddress which will throw
// on invalid input; otherwise fall back to a best-effort lowercase string.
export function normalizeAddress(addr?: string | null): string | null {
  if (!addr) return null
  try {
    // dynamic import to avoid forcing ethers into server bundles
    // (this function runs on client code paths before storing addresses)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { utils } = require('ethers')
    return utils.getAddress(String(addr))
  } catch (e) {
    try {
      return String(addr).toLowerCase()
    } catch (ee) {
      return null
    }
  }
}
