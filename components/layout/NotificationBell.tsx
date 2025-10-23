'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Bell, MessageSquare, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'comment_reply' | 'market_resolved'
  title: string
  message: string
  link: string
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const { address, isConnected } = useAccount()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch notifications when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isConnected, address])

  const fetchNotifications = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/notifications?userAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/notifications/mark-all-read?userAddress=${address}`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es,
    })
  }

  if (!isConnected) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto py-1 px-2"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Cargando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            notifications.map(notification => (
              <Link
                key={notification.id}
                href={notification.link}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id)
                  }
                  setIsOpen(false)
                }}
                className={cn(
                  'block px-4 py-3 hover:bg-muted border-b transition-colors',
                  !notification.isRead && 'bg-electric-purple/5'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon based on type */}
                  {notification.type === 'comment_reply' && (
                    <MessageSquare className="h-5 w-5 text-electric-purple mt-0.5 flex-shrink-0" />
                  )}
                  {notification.type === 'market_resolved' && (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-electric-purple mt-2 flex-shrink-0" />
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
