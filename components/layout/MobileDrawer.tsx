'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useAccount, useDisconnect } from 'wagmi'
import Link from 'next/link'
import Image from 'next/image'
import { X, FileText, Shield, Sun, Moon, LogOut, Bell, AlertCircle, MessageSquare, CheckCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getProfilePicture } from '@/lib/profileUtils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { TutorialDialog } from './TutorialDialog'

interface Notification {
  id: string
  type: 'comment_reply' | 'market_resolved'
  title: string
  message: string
  link: string
  isRead: boolean
  createdAt: string
}

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Mobile Drawer Menu
 * Slides in from the right side
 * Only visible on mobile
 * 
 * Structure matches desktop dropdown:
 * - Wallet address with Celo icon
 * - Notifications
 * - Términos
 * - Privacidad
 * - Theme toggle
 * - Como Funciona? (bottom)
 * - Logout
 */
export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load user avatar
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!address) {
        setUserAvatar('')
        return
      }

      try {
        const timestamp = Date.now()
        const response = await fetch(`/api/profile/update?walletAddress=${address}&_t=${timestamp}`, {
          cache: 'no-store',
        })
        if (response.ok) {
          const userData = await response.json()
          setUserAvatar(userData.customAvatar || getProfilePicture(address))
        } else {
          setUserAvatar(getProfilePicture(address))
        }
      } catch (error) {
        setUserAvatar(getProfilePicture(address))
      }
    }

    loadUserAvatar()
  }, [address])

  // Fetch notifications when user is connected
  useEffect(() => {
    if (address && showNotifications) {
      fetchNotifications()
    }
  }, [address, showNotifications])

  // Fetch unread count when drawer opens
  useEffect(() => {
    if (address && isOpen && !showNotifications) {
      fetchUnreadCount()
    }
  }, [address, isOpen])

  const fetchUnreadCount = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/notifications?userAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    if (!address) return

    setIsLoadingNotifications(true)
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
      setIsLoadingNotifications(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
      })

      if (response.ok) {
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

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLinkClick = () => {
    onClose()
  }

  const handleLogout = () => {
    disconnect()
    onClose()
  }

  const handleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={onClose}
            />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-background border-l border-border z-50 md:hidden overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold">Menú</h2>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-lg flex items-center justify-center transition-colors hover:bg-electric-purple/10 active:bg-electric-purple/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              {/* Profile Image + Wallet Address Section - Only shown when logged in */}
              {address && mounted && (
                <div className="px-4 py-3 border-b border-border flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Profile Image */}
                    <div className="relative h-10 w-10 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={userAvatar || getProfilePicture(address)}
                        alt="Profile"
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    {/* Celo Icon + Wallet Address */}
                    <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                      <div className="relative w-3 h-3 p-1 rounded bg-[#FCFF52] flex items-center justify-center flex-shrink-0">
                        <Image 
                          src="/celo.png" 
                          alt="Celo" 
                          fill 
                          sizes="12px" 
                          className="object-contain p-[2px]" 
                        />
                      </div>
                      {`${address.slice(0, 6)}...${address.slice(-6)}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Navigation Links */}
              <div className="p-4 space-y-2 flex-shrink-0">
                {/* Profile (logged in) */}
                {address && (
                  <Link
                    href="/perfil"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] hover:bg-electric-purple/10 active:bg-electric-purple/20"
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Perfil</span>
                  </Link>
                )}

                {/* Notifications */}
                {address && (
                  <>
                    <button
                      onClick={handleNotifications}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] w-full text-left relative hover:bg-electric-purple/10 active:bg-electric-purple/20"
                    >
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <div className="h-px bg-border my-2" />
                  </>
                )}

                {/* Términos */}
                <Link
                  href="/terminos"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] hover:bg-electric-purple/10 active:bg-electric-purple/20"
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Términos</span>
                </Link>

                {/* Privacidad */}
                <Link
                  href="/privacidad"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] hover:bg-electric-purple/10 active:bg-electric-purple/20"
                >
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Privacidad</span>
                </Link>

                <div className="h-px bg-border my-2" />

                {/* Theme Toggle */}
                {mounted && (
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="font-medium flex-1">Tema</span>
                    <div className="flex items-center gap-1 bg-muted rounded-md p-1 relative">
                      {/* Sliding background indicator */}
                      <motion.div
                        layoutId="mobile-drawer-theme-selector"
                        className="absolute bg-background rounded shadow-sm"
                        style={{
                          width: 'calc(50% - 4px)',
                          height: 'calc(100% - 8px)',
                          top: '4px',
                        }}
                        initial={false}
                        animate={{
                          left: resolvedTheme === 'light' ? '4px' : 'calc(50%)',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                      />

                      <button
                        onClick={() => setTheme('light')}
                        className={cn(
                          'p-2 rounded transition-colors duration-200 flex items-center justify-center relative z-10 min-w-[36px]',
                          resolvedTheme === 'light' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Sun className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={cn(
                          'p-2 rounded transition-colors duration-200 flex items-center justify-center relative z-10 min-w-[36px]',
                          resolvedTheme === 'dark' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Moon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Como Funciona? - Only shown when NOT logged in */}
                {!address && (
                  <>
                    <div className="h-px bg-border my-2" />
                    
                    <button
                      onClick={() => {
                        setShowTutorial(true)
                        onClose()
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] w-full text-left hover:bg-electric-purple/10 active:bg-electric-purple/20"
                    >
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">¿Cómo Funciona?</span>
                    </button>
                  </>
                )}
              </div>

              {/* Spacer to push bottom items down */}
              <div className="flex-1"></div>

              {/* Bottom Section - Como Funciona? (logged in only) & Logout */}
              <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
                {/* Como Funciona? - Only shown when logged in */}
                {address && (
                  <>
                    <button
                      onClick={() => {
                        setShowTutorial(true)
                        onClose()
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] w-full text-left hover:bg-electric-purple/10 active:bg-electric-purple/20"
                    >
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">¿Cómo Funciona?</span>
                    </button>

                    <div className="h-px bg-border my-2" />
                  </>
                )}

                {/* Logout - Only shown when logged in */}
                {address && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left min-h-[44px] text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Notifications Bottom Drawer */}
          <AnimatePresence>
            {showNotifications && address && (
              <>
                {/* Backdrop for notifications */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-[60] md:hidden"
                  onClick={() => setShowNotifications(false)}
                />

                {/* Notifications Drawer - Slides from bottom */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-3xl z-[60] md:hidden max-h-[80vh] flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                    <h3 className="font-semibold text-lg">Notificaciones</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-electric-purple hover:underline font-medium"
                        >
                          Marcar todas
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="h-10 w-10 rounded-lg flex items-center justify-center transition-colors hover:bg-electric-purple/10 active:bg-electric-purple/20"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto flex-1">
                    {isLoadingNotifications ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <p>Cargando...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No hay notificaciones</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map(notification => (
                          <Link
                            key={notification.id}
                            href={notification.link}
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsRead(notification.id)
                              }
                              setShowNotifications(false)
                              onClose()
                            }}
                            className={cn(
                              'block px-4 py-4 transition-colors hover:bg-electric-purple/10 active:bg-electric-purple/20',
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
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>

    {/* Como Funciona Tutorial Dialog - Shared component */}
    <TutorialDialog isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
  </>
  )
}
