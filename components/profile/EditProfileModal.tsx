'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/animate-ui/primitives/radix/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs'
import Image from 'next/image'
import { Upload, Loader2, Check, X } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatar: string
  currentUsername?: string
  walletAddress: string
  onSave: (data: {
    avatar?: string
    username?: string
  }) => Promise<void>
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentAvatar,
  currentUsername,
  walletAddress,
  onSave,
}: EditProfileModalProps) {
  const [isSaving, setSaving] = useState(false)

  // Avatar state
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null)
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [username, setUsername] = useState('')

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize username when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername || '')
    }
  }, [isOpen, currentUsername])

  // Check if form has changes
  useEffect(() => {
    const avatarChanged = customAvatarFile !== null || avatarUrl.trim() !== ''
    const usernameChanged = username !== (currentUsername || '')
    setHasChanges(avatarChanged || usernameChanged)
  }, [customAvatarFile, avatarUrl, username, currentUsername])

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate URL helper
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (only PNG and JPG)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, avatar: 'Solo se permiten archivos JPG o PNG' })
      return
    }

    // Validate file size (max 512KB)
    if (file.size > 512 * 1024) {
      setErrors({ ...errors, avatar: 'La imagen debe ser menor a 512KB' })
      return
    }

    setCustomAvatarFile(file)
    setCustomAvatarPreview(URL.createObjectURL(file))
    setErrors({ ...errors, avatar: '' })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (username && username.length < 3) {
      newErrors.username = 'El nombre debe tener al menos 3 caracteres'
    }

    if (username && username.length > 20) {
      newErrors.username = 'El nombre debe tener máximo 20 caracteres'
    }

    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username = 'Solo letras, números, guiones y guiones bajos'
    }

    if (avatarUrl && avatarUrl.trim()) {
      try {
        new URL(avatarUrl)
      } catch {
        newErrors.avatarUrl = 'URL inválida'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const data: any = {}

      // Handle avatar update
      if (avatarUrl && isValidUrl(avatarUrl)) {
        // Use URL directly - no upload needed
        data.avatar = avatarUrl
      } else if (customAvatarFile) {
        // Upload to Vercel Blob
        const formData = new FormData()
        formData.append('file', customAvatarFile)

        const uploadResponse = await fetch('/api/profile/upload-avatar', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload avatar')
        }

        const { url } = await uploadResponse.json()
        data.avatar = url
      }

      // Handle other fields
      if (username !== currentUsername) data.username = username

      await onSave(data)
      onClose()
    } catch (error) {
      console.error('Error saving profile:', error)
      setErrors({ ...errors, general: 'Error al guardar. Intentá de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      setCustomAvatarFile(null)
      setCustomAvatarPreview(null)
      setAvatarUrl('')
      setUsername(currentUsername || '')
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-background border border-border rounded-lg shadow-lg p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">Editar Perfil</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Avatar Upload Section */}
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  {customAvatarPreview || (avatarUrl && isValidUrl(avatarUrl)) ? (
                    <div className="relative w-24 h-24">
                      <Image
                        src={customAvatarPreview || avatarUrl}
                        alt="Preview"
                        width={96}
                        height={96}
                        className="rounded-xl object-cover w-24 h-24"
                      />
                      <button
                        onClick={() => {
                          setCustomAvatarFile(null)
                          setCustomAvatarPreview(null)
                          setAvatarUrl('')
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Image
                      src={currentAvatar}
                      alt="Current avatar"
                      width={96}
                      height={96}
                      className="rounded-xl object-cover w-24 h-24"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="mb-3 block">Foto de Perfil</Label>
                  
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Subir Imagen</TabsTrigger>
                      <TabsTrigger value="url">Usar URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContents transition={{ duration: 0.2, ease: "easeInOut" }}>
                      <TabsContent value="upload" className="mt-3 space-y-2 pb-2">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                          type="button"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Seleccionar Archivo
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground">
                          Máximo 512KB. Solo JPG o PNG.
                        </p>
                        {errors.avatar && (
                          <p className="text-sm text-red-500">{errors.avatar}</p>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="url" className="mt-3 space-y-2 pb-2">
                        <Input
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://ejemplo.com/imagen.jpg"
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Pegá la URL de tu imagen
                        </p>
                        {errors.avatarUrl && (
                          <p className="text-sm text-red-500">{errors.avatarUrl}</p>
                        )}
                      </TabsContent>
                    </TabsContents>
                  </Tabs>
                </div>
              </div>

              {/* Username & Wallet Row - Mobile: Stacked, Desktop: Side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tu_nombre"
                    className="mt-2"
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    3-20 caracteres. Solo letras, números, - y _
                  </p>
                </div>

                <div>
                  <Label>Wallet</Label>
                  <Input
                    value={walletAddress}
                    disabled
                    className="mt-2 opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    No se puede modificar
                  </p>
                </div>
              </div>
            </div>

        {errors.general && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-md text-sm">
            {errors.general}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-electric-purple hover:bg-electric-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  )
}
