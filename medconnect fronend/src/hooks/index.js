import { useState, useEffect, useRef, useCallback } from 'react'

// ── useDebounce ───────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ── usePagination ─────────────────────────────────────────────────────────────
export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page,  setPage]  = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const goTo    = (p)  => setPage(p)
  const goNext  = ()   => setPage((p) => p + 1)
  const goPrev  = ()   => setPage((p) => Math.max(1, p - 1))
  const reset   = ()   => setPage(1)

  const changeLimit = (l) => {
    setLimit(Number(l))
    setPage(1)
  }

  return { page, limit, goTo, goNext, goPrev, reset, changeLimit }
}

// ── useLocalStorage ───────────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const toStore = value instanceof Function ? value(stored) : value
      setStored(toStore)
      localStorage.setItem(key, JSON.stringify(toStore))
    } catch { /* silent */ }
  }, [key, stored])

  return [stored, setValue]
}

// ── useClickOutside ───────────────────────────────────────────────────────────
export function useClickOutside(handler) {
  const ref = useRef(null)
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler(e)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler])
  return ref
}

// ── useAsync ──────────────────────────────────────────────────────────────────
export function useAsync(asyncFn, immediate = true) {
  const [status, setStatus] = useState('idle')
  const [data,   setData]   = useState(null)
  const [error,  setError]  = useState(null)

  const execute = useCallback(async (...args) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await asyncFn(...args)
      setData(result)
      setStatus('success')
      return result
    } catch (err) {
      setError(err)
      setStatus('error')
      throw err
    }
  }, [asyncFn])

  useEffect(() => {
    if (immediate) execute()
  }, [immediate]) // eslint-disable-line

  return { execute, status, data, error, loading: status === 'loading' }
}

// ── useMediaQuery ─────────────────────────────────────────────────────────────
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export const useIsMobile  = () => useMediaQuery('(max-width: 767px)')
export const useIsTablet  = () => useMediaQuery('(max-width: 1023px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
