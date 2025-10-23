'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/animate-ui/components/radix/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'

interface SubmitProposalModalProps {
  userAddress?: string
  onProposalCreated?: () => void
}

export function SubmitProposalModal({ userAddress, onProposalCreated }: SubmitProposalModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    endDate: '',
    source: '',
    outcomes: ['Sí', 'No']
  })

  const categories = [
    { value: 'Deportes', label: 'Deportes' },
    { value: 'Economía', label: 'Economía' },
    { value: 'Política', label: 'Política' },
    { value: 'Crypto', label: 'Crypto' },
    { value: 'Cultura', label: 'Cultura' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userAddress) {
      alert('Por favor conecta tu wallet para proponer un mercado')
      return
    }

    if (!formData.title || !formData.category || !formData.endDate) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: userAddress
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create proposal')
      }

      // Reset form and close modal
      setFormData({
        title: '',
        category: '',
        endDate: '',
        source: '',
        outcomes: ['Sí', 'No']
      })
      setOpen(false)
      
      // Notify parent to refresh proposals
      onProposalCreated?.()
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert('Error al crear la propuesta. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...formData.outcomes]
    newOutcomes[index] = value
    setFormData({ ...formData, outcomes: newOutcomes })
  }

  const addOutcome = () => {
    if (formData.outcomes.length < 5) {
      setFormData({ ...formData, outcomes: [...formData.outcomes, ''] })
    }
  }

  const removeOutcome = (index: number) => {
    if (formData.outcomes.length > 2) {
      const newOutcomes = formData.outcomes.filter((_, i) => i !== index)
      setFormData({ ...formData, outcomes: newOutcomes })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-electric-purple backdrop-blur-lg w-full h-9 my-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-electric-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2 relative z-10" />
          <span className="relative z-10">Crear</span>
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
            <div className="relative h-full w-10 bg-white/30"></div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-full max-h-[90vh] overflow-y-auto">
        <DialogTitle>Nueva Propuesta de Mercado</DialogTitle>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Question/Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Pregunta <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="¿Sucederá esto antes del 2026?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">{formData.title.length}/200</p>
          </div>

          {/* Outcomes */}
          <div className="space-y-2">
            <Label>Opciones del Mercado <span className="text-red-500">*</span></Label>
            <div className="space-y-2">
              {formData.outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={outcome}
                    onChange={(e) => handleOutcomeChange(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    required
                  />
                  {formData.outcomes.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOutcome(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {formData.outcomes.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOutcome}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Opción
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 2 opciones, máximo 5
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Categoría <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">
              Fecha Estimada de Cierre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Fuente (Opcional)</Label>
            <Input
              id="source"
              type="url"
              placeholder="https://ejemplo.com/fuente"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !userAddress}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Propuesta'}
          </Button>

          {!userAddress && (
            <p className="text-xs text-center text-muted-foreground">
              Conecta tu wallet para proponer un mercado
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
