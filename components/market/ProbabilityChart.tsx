'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, LineData, LineSeries } from 'lightweight-charts'
import { useTheme } from 'next-themes'
import { LogoSpinner } from '@/components/ui/logo-spinner'

interface PricePoint {
  value: number
  timestamp: number
  date: string
}

interface PriceChart {
  timeframe: string
  prices: PricePoint[]
}

interface Outcome {
  id: number
  title: string
  price: number
  price_charts?: PriceChart[]
}

interface ProbabilityChartProps {
  outcomes: Outcome[]
  timeframe?: '24h' | '7d' | '30d' | 'all'
  className?: string
}

export function ProbabilityChart({ outcomes, timeframe = '24h', className = '' }: ProbabilityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRefs = useRef<Map<number, ISeriesApi<'Line'>>>(new Map())
  const tooltipRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pulseMarkers, setPulseMarkers] = useState<Array<{ x: number; y: number; color: string }>>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !chartContainerRef.current) return

    const isDark = theme === 'dark'

    // Grid colors with reduced opacity (50%)
    const gridColor = isDark 
      ? 'rgba(31, 41, 55, 0.5)'  // gray-800 at 50% opacity
      : 'rgba(243, 244, 246, 0.5)' // gray-100 at 50% opacity

    // Chart colors based on theme
    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#9ca3af' : '#6b7280',
      },
      grid: {
        vertLines: { 
          color: gridColor,
          style: 2, // 2 = dashed, 1 = dotted, 0 = solid
          visible: true,
        },
        horzLines: { 
          color: gridColor,
          style: 2, // 2 = dashed
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          visible: true,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
      rightPriceScale: {
        borderColor: 'transparent', // Transparent Y-axis line
      },
      timeScale: {
        rightOffset: 15, // Add empty space on the right side
        borderColor: 'transparent', // Transparent X-axis line
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: 400,
    })

    chartRef.current = chart

    // Outcome colors - Green for first (usually "Yes"), Red for second (usually "No")
    const outcomeColors = [
      { lineColor: '#22c55e', topColor: 'rgba(34, 197, 94, 0.4)', bottomColor: 'rgba(34, 197, 94, 0.0)' }, // Green
      { lineColor: '#ef4444', topColor: 'rgba(239, 68, 68, 0.4)', bottomColor: 'rgba(239, 68, 68, 0.0)' }, // Red
    ]

    // Add series for each outcome
    outcomes.forEach((outcome, index) => {
      const colors = outcomeColors[index] || outcomeColors[0]
      
      const series = chart.addSeries(LineSeries, {
        color: colors.lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true, // Show dot marker on hover
        crosshairMarkerRadius: 2, // Size of the hover dot
        crosshairMarkerBorderColor: colors.lineColor, // Border color matches line
        crosshairMarkerBackgroundColor: colors.lineColor, // Fill color matches line
        title: outcome.title,
        lastValueVisible: true, // Show last value label on Y-axis
        priceLineVisible: false, // Hide horizontal price marker line
        lastPriceAnimation: 0, // Disable last price animation
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      })

      // Find the price chart for the selected timeframe
      const priceChart = outcome.price_charts?.find(pc => pc.timeframe === timeframe)
      
      console.log(`📊 Chart data for ${outcome.title}:`, {
        currentPrice: outcome.price,
        timeframe,
        priceChartFound: !!priceChart,
        priceCount: priceChart?.prices.length || 0,
        samplePrices: priceChart?.prices.slice(0, 3),
      })
      
      if (priceChart && priceChart.prices.length > 0) {
        // Convert to lightweight-charts format and remove duplicates
        const dataMap = new Map<number, number>()
        
        // Use Map to automatically handle duplicates (later values overwrite earlier ones)
        priceChart.prices.forEach(point => {
          // Multiply by 100 to convert decimal probability (0.1) to percentage (10)
          dataMap.set(point.timestamp, point.value * 100)
        })
        
        // Convert to array and sort by timestamp ascending
        const data: LineData[] = Array.from(dataMap.entries())
          .sort((a, b) => a[0] - b[0]) // Sort by timestamp ascending
          .map(([timestamp, value]) => ({
            time: timestamp as any,
            value: value,
          }))

        console.log(`📈 Processed ${data.length} data points for ${outcome.title}:`, data.slice(0, 3), '...', data.slice(-3))

        // Only set data if we have at least one point
        if (data.length > 0) {
          series.setData(data)
        }
      }

      seriesRefs.current.set(outcome.id, series)
    })

    // Fit content
    chart.timeScale().fitContent()

    // Setup custom tooltip
    if (tooltipRef.current) {
      const tooltip = tooltipRef.current
      
      chart.subscribeCrosshairMove((param) => {
        if (
          !param.time ||
          param.point === undefined ||
          param.point.x < 0 ||
          param.point.y < 0
        ) {
          tooltip.style.opacity = '0'
          tooltip.style.pointerEvents = 'none'
          return
        }

        // Get data for all outcomes at this time point
        const tooltipData: Array<{ title: string; value: number; color: string }> = []
        
        outcomes.forEach((outcome, index) => {
          const series = seriesRefs.current.get(outcome.id)
          if (series) {
            const data = param.seriesData.get(series)
            if (data && 'value' in data) {
              tooltipData.push({
                title: outcome.title,
                value: data.value as number,
                color: index === 0 ? '#22c55e' : '#ef4444', // Green for first, Red for second
              })
            }
          }
        })

        if (tooltipData.length === 0) {
          tooltip.style.opacity = '0'
          tooltip.style.pointerEvents = 'none'
          return
        }

        // Format timestamp
        const timestamp = param.time as number
        const date = new Date(timestamp * 1000)
        const dateStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
        })
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
        })

        // Build tooltip HTML with Shadcn styling
        tooltip.innerHTML = `
          <div class="text-xs font-medium mb-1.5 opacity-80">${dateStr} - ${timeStr}</div>
          ${tooltipData.map(item => `
            <div class="flex items-center justify-between gap-4 py-0.5">
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></div>
                <span class="font-medium">${item.title}:</span>
              </div>
              <span class="font-semibold">${item.value.toFixed(2)}%</span>
            </div>
          `).join('')}
        `

        // Position tooltip
        const chartRect = chartContainerRef.current?.getBoundingClientRect()
        if (chartRect) {
          const tooltipWidth = tooltip.offsetWidth
          const tooltipHeight = tooltip.offsetHeight
          
          // Default position: right and above the crosshair
          let left = param.point.x + 15
          let top = param.point.y - tooltipHeight - 10

          // Prevent tooltip from going off right edge
          if (left + tooltipWidth > chartRect.width) {
            left = param.point.x - tooltipWidth - 15
          }

          // Prevent tooltip from going off top edge
          if (top < 0) {
            top = param.point.y + 15
          }

          tooltip.style.left = `${left}px`
          tooltip.style.top = `${top}px`
          tooltip.style.opacity = '1'
          tooltip.style.pointerEvents = 'auto'
        }
      })
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    // Update pulse marker positions
    const updatePulseMarkers = () => {
      const markers: Array<{ x: number; y: number; color: string }> = []
      
      outcomes.forEach((outcome, index) => {
        const series = seriesRefs.current.get(outcome.id)
        const priceChart = outcome.price_charts?.find(pc => pc.timeframe === timeframe)
        
        if (series && priceChart && priceChart.prices.length > 0) {
          const lastPrice = priceChart.prices[priceChart.prices.length - 1]
          
          // Convert price and time to chart coordinates
          const valueInPercentage = lastPrice.value * 100 // Convert to percentage display
          const yCoordinate = series.priceToCoordinate(valueInPercentage)
          const xCoordinate = chart.timeScale().timeToCoordinate(lastPrice.timestamp as any)
          
          console.log(`🎯 Marker for ${outcome.title}:`, {
            value: lastPrice.value,
            valueInPercentage,
            timestamp: lastPrice.timestamp,
            x: xCoordinate,
            y: yCoordinate,
          })
          
          if (yCoordinate !== null && xCoordinate !== null) {
            markers.push({
              x: xCoordinate,
              y: yCoordinate,
              color: index === 0 ? '#22c55e' : '#ef4444', // Green for Yes, Red for No
            })
          }
        }
      })
      
      console.log(`📍 Total markers:`, markers)
      setPulseMarkers(markers)
    }

    // Initial marker update
    updatePulseMarkers()

    // Update markers when chart is resized or panned
    const handleChartUpdate = () => {
      updatePulseMarkers()
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleChartUpdate)

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleChartUpdate)
      chart.remove()
      seriesRefs.current.clear()
    }
  }, [outcomes, timeframe, theme, mounted])

  // Real-time update effect
  useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      // Update the chart with latest data from outcomes
      outcomes.forEach(outcome => {
        const series = seriesRefs.current.get(outcome.id)
        if (!series) return

        const priceChart = outcome.price_charts?.find(pc => pc.timeframe === timeframe)
        if (!priceChart || priceChart.prices.length === 0) return

        const latestPoint = priceChart.prices[priceChart.prices.length - 1]
        
        // Update the last point (multiply by 100 to convert to percentage)
        series.update({
          time: latestPoint.timestamp as any,
          value: latestPoint.value * 100,
        })
      })
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [outcomes, timeframe, mounted])

  if (!mounted) {
    return (
      <div className={`w-full h-[400px] flex items-center justify-center bg-muted/10 rounded-lg ${className}`}>
        <LogoSpinner size={40} />
      </div>
    )
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div ref={chartContainerRef} className="w-full" />
      
      {/* Pulsing dots at current values */}
      {pulseMarkers.map((marker, index) => (
        <div
          key={index}
          className="absolute pointer-events-none"
          style={{
            left: `${marker.x}px`,
            top: `${marker.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Single continuous pulse */}
          <div
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: marker.color,
              animation: 'glowPulse 1.5s cubic-bezier(0.42, 0, 0.58, 1) infinite',
            }}
          />
          {/* Solid center dot (always visible) */}
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: marker.color,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      ))}
      
      {/* Custom Tooltip with Shadcn styling */}
      <div
        ref={tooltipRef}
        className="absolute z-50 bg-primary text-primary-foreground rounded-md px-3 py-2 text-xs pointer-events-none opacity-0 min-w-[180px] shadow-lg"
        style={{
          transition: 'opacity 0.5s cubic-bezier(0.42, 0, 0.58, 1)', // easeInOut matching project standards
        }}
      />
      
      {/* Custom CSS for pulse animation */}
      <style jsx>{`
        @keyframes glowPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
