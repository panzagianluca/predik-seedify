'use client'

import { useState, useRef } from 'react'
import { Bold, Italic, Underline, Image as ImageIcon, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentFormProps {
  marketId: string
  userAddress?: string
  avatarUrl?: string
  parentId?: string
  onSubmit?: (content: string, gifUrl?: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
}

export function CommentForm({
  marketId,
  userAddress,
  avatarUrl,
  parentId,
  onSubmit,
  onCancel,
  placeholder = "Escribe un comentario..."
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [gifUrl, setGifUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const maxChars = 300
  const remaining = maxChars - content.length

  // Use custom avatar if provided, otherwise generate from address
  const displayAvatar = avatarUrl || (userAddress ? `https://api.dicebear.com/7.x/identicon/svg?seed=${userAddress}` : null)

  const insertMarkdown = (before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText = 
      content.substring(0, start) +
      before + selectedText + after +
      content.substring(end)

    setContent(newText)
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const handleSubmit = async () => {
    if (!content.trim() || !userAddress) return
    if (content.length > maxChars) return

    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(content, gifUrl || undefined)
      } else {
        // Default API call
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketId,
            userAddress,
            content,
            gifUrl: gifUrl || undefined,
            parentId
          })
        })

        if (!response.ok) throw new Error('Failed to post comment')
      }

      // Reset form
      setContent('')
      setGifUrl('')
      if (onCancel) onCancel()
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Error al publicar comentario')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        {displayAvatar && (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={displayAvatar}
              alt="Your avatar"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Input Area */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full min-h-[80px] p-3 rounded-lg",
              "bg-muted/50 border border-border",
              "focus:outline-none focus:ring-2 focus:ring-electric-purple/50",
              "resize-none text-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={!userAddress || isSubmitting}
            maxLength={maxChars}
          />

          {/* GIF Preview */}
          {gifUrl && (
            <div className="mt-2 relative max-w-xs">
              <img src={gifUrl} alt="Selected GIF" className="rounded-lg w-full" />
              <button
                onClick={() => setGifUrl('')}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {/* Bold */}
              <button
                onClick={() => insertMarkdown('**')}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="Bold"
                disabled={!userAddress}
              >
                <Bold className="h-4 w-4" />
              </button>

              {/* Italic */}
              <button
                onClick={() => insertMarkdown('*')}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="Italic"
                disabled={!userAddress}
              >
                <Italic className="h-4 w-4" />
              </button>

              {/* Underline */}
              <button
                onClick={() => insertMarkdown('__')}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="Underline"
                disabled={!userAddress}
              >
                <Underline className="h-4 w-4" />
              </button>

              <div className="w-px h-4 bg-border mx-1" />

              {/* GIF Picker - Placeholder for now */}
              <button
                onClick={() => alert('GIF picker coming soon!')}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="GIF"
                disabled={!userAddress}
              >
                <ImageIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Character Count & Post Button */}
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-xs",
                remaining < 50 ? "text-orange-500" : "text-muted-foreground",
                remaining < 0 && "text-red-500"
              )}>
                {remaining}/{maxChars}
              </span>

              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
              )}

              <button
                onClick={handleSubmit}
                disabled={!content.trim() || !userAddress || isSubmitting || remaining < 0}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-lg",
                  "bg-electric-purple text-white text-sm font-medium",
                  "hover:bg-electric-purple/90 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? 'Publicando...' : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Publicar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
