import { useEffect, useState } from 'react'

export function useCountUp(end: number, duration: number = 200, enabled: boolean = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }

    let startTime: number | null = null
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // easeOut curve for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(easeOut * end)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(end) // Ensure we end at exact value
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, enabled])

  return count
}
