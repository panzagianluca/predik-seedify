import { LogoSpinner } from '@/components/ui/logo-spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LogoSpinner size={60} />
    </div>
  )
}
