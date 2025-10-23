'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'

interface TutorialDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function TutorialDialog({ isOpen, onClose }: TutorialDialogProps) {
  const [tutorialStep, setTutorialStep] = useState(1)
  const [selectedOutcome, setSelectedOutcome] = useState<'si' | 'no'>('si')

  // Reset to step 1 when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTutorialStep(1)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden"
        from="top"
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <DialogTitle className="sr-only">Como Funciona Predik</DialogTitle>
        
        {tutorialStep === 1 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Como Funciona Predik?</h2>
            <p className="text-sm text-muted-foreground mb-4">Elegí un mercado</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>

              <button
                onClick={() => setTutorialStep(2)}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 w-full text-left transition-all duration-300 hover:border-electric-purple/50 hover:bg-electric-purple/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{ animation: 'pulse-scale 2s ease-in-out infinite' }}
              >
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                  <div className="relative w-8 h-8">
                    <Image src="/prediklogoonly.svg" alt="Predik" fill sizes="32px" className="object-contain" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1">Pasará esto?</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">Si:</span>
                      <span className="font-semibold text-[#22c55e]">65.0%</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">No:</span>
                      <span className="font-semibold text-[#ef4444]">35.0%</span>
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {tutorialStep === 2 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Como Funciona Predik?</h2>
            <p className="text-sm text-muted-foreground mb-4">Hacé tu predicción</p>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-electric-purple bg-electric-purple/5 mb-4">
              <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                <div className="relative w-8 h-8">
                  <Image src="/prediklogoonly.svg" alt="Predik" fill sizes="32px" className="object-contain" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">Pasará esto?</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Si:</span>
                    <span className="font-semibold text-[#22c55e]">65.0%</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">No:</span>
                    <span className="font-semibold text-[#ef4444]">35.0%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 relative">
                <motion.div
                  layoutId="tutorial-outcome-selector"
                  className="absolute rounded-md border-2"
                  style={{
                    width: 'calc(50% - 4px)',
                    height: '100%',
                    top: 0,
                    backgroundColor: selectedOutcome === 'si' ? 'rgb(34 197 94 / 0.2)' : 'rgb(239 68 68 / 0.2)',
                    borderColor: selectedOutcome === 'si' ? 'rgb(34 197 94)' : 'rgb(239 68 68)',
                  }}
                  initial={false}
                  animate={{ left: selectedOutcome === 'si' ? '0px' : 'calc(50% + 4px)' }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
                
                <button
                  onClick={() => setSelectedOutcome('si')}
                  className={`h-auto py-3 rounded-md border-2 flex items-center justify-between px-4 transition-colors relative z-10 ${
                    selectedOutcome === 'si' ? 'border-transparent bg-transparent' : 'border-border bg-muted/30'
                  }`}
                >
                  <span className="font-semibold text-sm text-green-700 dark:text-green-400">Si</span>
                  <span className="text-xs text-green-600 dark:text-green-500">65.0%</span>
                </button>
                <button
                  onClick={() => setSelectedOutcome('no')}
                  className={`h-auto py-3 rounded-md border-2 flex items-center justify-between px-4 transition-colors relative z-10 ${
                    selectedOutcome === 'no' ? 'border-transparent bg-transparent' : 'border-border bg-muted/30'
                  }`}
                >
                  <span className="font-semibold text-sm text-red-700 dark:text-red-400">No</span>
                  <span className="text-xs text-red-600 dark:text-red-500">35.0%</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cantidad</label>
                <div className="h-9 px-3 rounded-md border border-input bg-background flex items-center justify-between text-sm">
                  <span>100</span>
                  <span className="text-muted-foreground">USDT</span>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold text-sm">Resumen</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Acciones totales de {selectedOutcome === 'si' ? 'Si' : 'No'}</span>
                    <span className="font-medium">{selectedOutcome === 'si' ? '154' : '286'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia Máxima</span>
                    <span className="font-semibold text-green-600">{selectedOutcome === 'si' ? '+54 USDT' : '+186 USDT'}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={() => setTutorialStep(3)} className="w-full h-9 mt-4">
              Comprar {selectedOutcome === 'si' ? 'Si' : 'No'}
            </Button>
          </div>
        )}

        {tutorialStep === 3 && (
          <div className="p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Como Funciona Predik?</h2>
            <p className="text-sm text-muted-foreground mb-4">Disfrutá tus ganancias</p>

            <div className="space-y-4 mb-4">
              <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-green-500 bg-green-500/10">
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                  <div className="relative w-8 h-8">
                    <Image src="/prediklogoonly.svg" alt="Predik" fill sizes="32px" className="object-contain" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Pasará esto?</h4>
                  <p className="text-xs text-green-600 font-semibold">Tu predicción fue correcta! ✓</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Invertiste</span>
                  <span className="font-medium">100 USDT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ganaste</span>
                  <span className="font-bold text-green-600 text-lg">+54 USDT</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">154 USDT</span>
                </div>
              </div>
            </div>

            <Button onClick={() => onClose()} className="w-full h-9">
              Empezar a predecir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
