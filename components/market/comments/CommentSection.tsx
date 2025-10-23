'use client'

import { useEffect, useState } from 'react'
import { Comment } from '@/types/comment'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { MessageSquare } from 'lucide-react'
import { fetchUserProfile } from '@/lib/userUtils'

interface CommentSectionProps {
  marketId: string
  userAddress?: string
  avatarUrl?: string
}

export function CommentSection({ marketId, userAddress }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [userProfile, setUserProfile] = useState<{ username?: string; customAvatar?: string } | null>(null)

  const limit = 10

  // Fetch user profile
  useEffect(() => {
    if (userAddress) {
      fetchUserProfile(userAddress).then(setUserProfile)
    }
  }, [userAddress])

  // Fetch comments
  const fetchComments = async (offset: number = 0) => {
    try {
      const params = new URLSearchParams({
        market_id: marketId,
        limit: limit.toString(),
        offset: offset.toString()
      })
      
      // Include user_address if available to get hasVoted status
      if (userAddress) {
        params.append('user_address', userAddress)
      }
      
      const response = await fetch(`/api/comments?${params}`)
      
      if (!response.ok) throw new Error('Failed to fetch comments')
      
      const data: Comment[] = await response.json()
      
      console.log('Fetched comments:', data)
      
      if (offset === 0) {
        setComments(data)
      } else {
        setComments(prev => [...prev, ...data])
      }
      
      setHasMore(data.length === limit)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [marketId, userAddress]) // Refetch when user connects/disconnects wallet

  const handleNewComment = async (content: string, gifUrl?: string) => {
    if (!userAddress) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          userAddress,
          content,
          gifUrl,
          parentId: replyingTo
        })
      })

      if (!response.ok) throw new Error('Failed to post comment')

      const newComment: Comment = await response.json()

      if (replyingTo) {
        // Add as a reply
        setComments(prev => prev.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            }
          }
          return comment
        }))
        setReplyingTo(null)
      } else {
        // Add as top-level comment
        setComments(prev => [newComment, ...prev])
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      throw error
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!userAddress) return
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return

    try {
      const response = await fetch(
        `/api/comments/${commentId}?user_address=${userAddress}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete comment')

      // Remove from state
      setComments(prev => {
        // Remove if top-level
        const filtered = prev.filter(c => c.id !== commentId)
        
        // Remove if reply
        return filtered.map(comment => ({
          ...comment,
          replies: comment.replies?.filter(r => r.id !== commentId)
        }))
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Error al eliminar comentario')
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchComments(nextPage * limit)
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Cargando comentarios...</p>
      </div>
    )
  }

  return (
    <div className="overflow-visible">
      {/* Comment Form */}
      <CommentForm
        marketId={marketId}
        userAddress={userAddress}
        avatarUrl={userProfile?.customAvatar}
        onSubmit={handleNewComment}
        placeholder={
          !userAddress 
            ? "Conecta tu wallet para comentar..."
            : "Escribe un comentario..."
        }
      />

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay comentarios aún</p>
          <p className="text-sm mt-1">¡Sé el primero en comentar!</p>
        </div>
      ) : (
        <div>
          {comments.map(comment => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                userAddress={userAddress}
                onReply={setReplyingTo}
                onDelete={handleDeleteComment}
              />
              
              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="ml-12 mt-2">
                  <CommentForm
                    marketId={marketId}
                    userAddress={userAddress}
                    avatarUrl={userProfile?.customAvatar}
                    parentId={comment.id}
                    onSubmit={handleNewComment}
                    onCancel={() => setReplyingTo(null)}
                    placeholder="Escribe una respuesta..."
                  />
                </div>
              )}
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-4 border-t border-border">
              <button
                onClick={handleLoadMore}
                className="text-sm text-electric-purple hover:underline"
              >
                Cargar más comentarios
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
