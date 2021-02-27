import { Falsy } from 'utility-types'
import React, { useState, useEffect, useMemo, useRef, useContext } from 'react'
import { useLiveRef } from './misc'

export type Callback = (dt: number, t: number) => void

function useAnimationFrame(onFrame: Callback | Falsy) {
  const onFrameRef = useLiveRef(onFrame)
  const timeBase = useRef(0)

  useEffect(() => {
    if (!onFrameRef.current) return

    let isMounted = true
    let rafHandle: number | null = null
    let prevTime: number | null = null
    let initialTime: number | null = null

    function callback(time: number) {
      const realCallback = onFrameRef.current
      time /= 1000.0
      initialTime ??= time
      const dt = time - (prevTime ?? 0)
      const t = timeBase.current + (time - (initialTime ?? 0))
      if (realCallback) realCallback(dt, t)
      prevTime = time
      rafHandle = isMounted && realCallback ? window.requestAnimationFrame(callback) : null
    }

    rafHandle = window.requestAnimationFrame(callback)

    return () => {
      isMounted = false
      timeBase.current += (prevTime ?? 0) - (initialTime ?? 0)
      if (rafHandle !== null) window.cancelAnimationFrame(rafHandle)
    }
  }, [Boolean(onFrame)])
}

const AnimationLoopContext = React.createContext({
  isRunning: false,
  subscribe(fn: Callback) {},
  unsubscribe(fn: Callback) {}
})

export const AnimationLoop = React.memo(function AnimationLoop({
  isRunning = true,
  children
}: {
  isRunning?: boolean
  children?: React.ReactNode
}) {
  const subscribers = useMemo(() => new Set<Callback>(), [])
  const ctx = useMemo(() => {
    return {
      isRunning,
      subscribers,
      subscribe(fn: Callback) {
        subscribers.add(fn)
      },
      unsubscribe(fn: Callback) {
        subscribers.delete(fn)
      }
    }
  }, [isRunning])

  useAnimationFrame(
    isRunning &&
      ((dt, t) => {
        for (const callback of ctx.subscribers) {
          callback(dt, t)
        }
      })
  )

  return <AnimationLoopContext.Provider value={ctx}>{children}</AnimationLoopContext.Provider>
})

export function useAnimationLoop(onFrame?: Callback | Falsy): { isRunning: boolean } {
  const onFrameRef = useLiveRef(onFrame)
  const ctx = useContext(AnimationLoopContext)
  useEffect(() => {
    const callback: Callback = (dt, t) => {
      if (onFrameRef.current) onFrameRef.current(dt, t)
    }
    ctx.subscribe(callback)
    return () => {
      ctx.unsubscribe(callback)
    }
  }, [])
  return ctx
}
