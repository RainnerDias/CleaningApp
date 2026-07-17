'use client'

import { useSyncExternalStore } from 'react'

function readVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export interface ChartColors {
  completed: string
  pending: string
  skipped: string
  destructive: string
}

const FALLBACKS: ChartColors = {
  completed: 'oklch(0.52 0.14 145)',
  pending: 'oklch(0.72 0.17 75)',
  skipped: 'oklch(0.708 0 0)',
  destructive: 'oklch(0.577 0.245 27.325)',
}

// noop subscribe — CSS variables don't push updates
const subscribe = () => () => {}

// Module-level cache so getClientSnapshot returns a stable reference
// when the underlying CSS variable values haven't changed.
// useSyncExternalStore uses Object.is to compare snapshots — returning a
// new object every call causes an infinite re-render loop (React error #185).
let _cached: ChartColors = FALLBACKS

function getClientSnapshot(): ChartColors {
  const completed = readVar('--chart-completed', FALLBACKS.completed)
  const pending = readVar('--chart-pending', FALLBACKS.pending)
  const skipped = readVar('--chart-skipped', FALLBACKS.skipped)
  const destructive = readVar('--destructive', FALLBACKS.destructive)

  if (
    _cached.completed === completed &&
    _cached.pending === pending &&
    _cached.skipped === skipped &&
    _cached.destructive === destructive
  ) {
    return _cached
  }

  _cached = { completed, pending, skipped, destructive }
  return _cached
}

function getServerSnapshot(): ChartColors {
  return FALLBACKS
}

export function useChartColors(): ChartColors {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
