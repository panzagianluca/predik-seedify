'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, AreaData, AreaSeries } from 'lightweight-charts'
import { useTheme } from 'next-themes'
import { LogoSpinner } from '@/components/ui/logo-spinner'
import { UserTransaction, MarketAction } from '@/hooks/use-user-transactions'
import { formatUnits } from 'viem'

interface WinningsDataPoint {
  time: number
  value: number
  cumulativeInvested: number
  cumulativeWithdrawn: number
}

interface WinningsChartProps {
  transactions: UserTransaction[]
  tokenDecimals?: number
  tokenSymbol?: string
  className?: string
}

export function WinningsChart({ 
  transactions, 
  tokenDecimals = 6,
  tokenSymbol = 'USDC',
  className = '' 
}: WinningsChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !chartContainerRef.current || transactions.length === 0) return

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
          style: 2, // dashed
          visible: true,
        },
        horzLines: { 
          color: gridColor,
          style: 2, // dashed
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
        borderColor: 'transparent',
      },
      timeScale: {
        rightOffset: 15,
        borderColor: 'transparent',
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
      height: 300,
    })

    chartRef.current = chart

    // Calculate cumulative P&L over time
    const sortedTransactions = [...transactions].sort((a, b) => a.timestamp - b.timestamp)
    
    let cumulativeInvested = BigInt(0)
    let cumulativeWithdrawn = BigInt(0)
    
    const dataPoints: WinningsDataPoint[] = sortedTransactions.map((tx) => {
      // Money going in: Buy, Add Liquidity
      if (tx.action === MarketAction.BUY || tx.action === MarketAction.ADD_LIQUIDITY) {
        cumulativeInvested += tx.value
      }

      // Money coming out: Sell, Remove Liquidity, Claims
      if (
        tx.action === MarketAction.SELL ||
        tx.action === MarketAction.REMOVE_LIQUIDITY ||
        tx.action === MarketAction.CLAIM_WINNINGS ||
        tx.action === MarketAction.CLAIM_LIQUIDITY ||
        tx.action === MarketAction.CLAIM_FEES ||
        tx.action === MarketAction.CLAIM_VOIDED
      ) {
        cumulativeWithdrawn += tx.value
      }

      const netPL = cumulativeWithdrawn - cumulativeInvested
      const netPLNumber = Number(formatUnits(netPL, tokenDecimals))
      const investedNumber = Number(formatUnits(cumulativeInvested, tokenDecimals))
      const withdrawnNumber = Number(formatUnits(cumulativeWithdrawn, tokenDecimals))

      return {
        time: tx.timestamp,
        value: netPLNumber,
        cumulativeInvested: investedNumber,
        cumulativeWithdrawn: withdrawnNumber,
      }
    })

    console.log('📊 Winnings chart data:', dataPoints.slice(0, 5), '...', dataPoints.slice(-5))

    // Determine if overall P&L is positive or negative
    const finalPL = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0
    const isPositive = finalPL >= 0

    // Colors: Green for profit, Red for loss
    const lineColor = isPositive ? '#22c55e' : '#ef4444'
    const topColor = isPositive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
    const bottomColor = isPositive ? 'rgba(34, 197, 94, 0.0)' : 'rgba(239, 68, 68, 0.0)'

    // Create area series
    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: lineColor,
      lastValueVisible: true,
      priceLineVisible: false, // Remove dotted line from last value
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    seriesRef.current = series

    // Set data
    const chartData: AreaData[] = dataPoints.map(point => ({
      time: point.time as any,
      value: point.value,
    }))

    series.setData(chartData)

    // Fit content to show full period
    chart.timeScale().fitContent()
    
    // Set visible range to show entire dataset by default
    if (chartData.length > 0) {
      const firstTime = chartData[0].time as number
      const lastTime = chartData[chartData.length - 1].time as number
      
      // Add 5% padding on both sides
      const timeRange = lastTime - firstTime
      const padding = timeRange * 0.05
      
      chart.timeScale().setVisibleRange({
        from: (firstTime - padding) as any,
        to: (lastTime + padding) as any,
      })
    }

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

        const data = param.seriesData.get(series)
        if (!data || !('value' in data)) {
          tooltip.style.opacity = '0'
          tooltip.style.pointerEvents = 'none'
          return
        }

        // Find the full data point
        const timestamp = param.time as number
        const dataPoint = dataPoints.find(p => p.time === timestamp)
        
        if (!dataPoint) {
          tooltip.style.opacity = '0'
          tooltip.style.pointerEvents = 'none'
          return
        }

        // Format timestamp
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

        const plValue = dataPoint.value
        const plSign = plValue >= 0 ? '+' : ''
        const plColor = plValue >= 0 ? '#22c55e' : '#ef4444'

        // Build tooltip HTML
        tooltip.innerHTML = `
          <div class="text-xs font-medium mb-1.5 opacity-80">${dateStr} - ${timeStr}</div>
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-4">
              <span class="opacity-80">Net P&L:</span>
              <span class="font-bold" style="color: ${plColor}">${plSign}${plValue.toFixed(2)} ${tokenSymbol}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="opacity-80">Invested:</span>
              <span class="font-semibold">${dataPoint.cumulativeInvested.toFixed(2)} ${tokenSymbol}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="opacity-80">Withdrawn:</span>
              <span class="font-semibold">${dataPoint.cumulativeWithdrawn.toFixed(2)} ${tokenSymbol}</span>
            </div>
          </div>
        `

        // Position tooltip
        const chartRect = chartContainerRef.current?.getBoundingClientRect()
        if (chartRect) {
          const tooltipWidth = tooltip.offsetWidth
          const tooltipHeight = tooltip.offsetHeight
          
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

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [transactions, theme, mounted, tokenDecimals, tokenSymbol])

  if (!mounted) {
    return (
      <div className={`w-full h-[300px] flex items-center justify-center bg-muted/10 rounded-lg ${className}`}>
        <LogoSpinner size={40} />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className={`w-full h-[300px] flex flex-col items-center justify-center bg-muted/10 rounded-lg ${className}`}>
        <p className="text-muted-foreground text-sm">No trading history yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Start trading to see your performance</p>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div ref={chartContainerRef} className="w-full" />
      
      {/* Custom Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-50 bg-primary text-primary-foreground rounded-md px-3 py-2 text-xs pointer-events-none opacity-0 min-w-[200px] shadow-lg"
        style={{
          transition: 'opacity 0.5s cubic-bezier(0.42, 0, 0.58, 1)',
        }}
      />
    </div>
  )
}
