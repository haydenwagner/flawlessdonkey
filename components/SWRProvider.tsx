"use client"

import { SWRConfig } from "swr"

// SWR v2 evicts cache entries when all subscribers unmount (navigate away).
// This subclass ignores those deletes so the cache survives page transitions.
class PersistentCache extends Map {
  delete() { return false }
}

const cache = new PersistentCache()
const config = {
  provider: () => cache,
  revalidateOnFocus: false,
  dedupingInterval: 300_000,
}

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={config}>
      {children}
    </SWRConfig>
  )
}
