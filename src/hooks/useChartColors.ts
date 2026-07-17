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

function getClientSnapshot(): ChartColors {
  return {
    completed: readVar('--chart-completed', FALLBACKS.completed),
    pending: readVar('--chart-pending', FALLBACKS.pending),
    skipped: readVar('--chart-skipped', FALLBACKS.skipped),
    destructive: readVar('--destructive', FALLBACKS.destructive),
  }
}

function getServerSnapshot(): ChartColors {
  return FALLBACKS
}

export function useChartColors(): ChartColors {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
