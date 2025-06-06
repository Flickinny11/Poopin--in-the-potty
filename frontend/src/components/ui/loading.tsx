import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-primary-500", sizeClasses[size], className)} />
  )
}

interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export function Loading({ message = "Loading...", fullScreen = false }: LoadingProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
    : "flex items-center justify-center p-8"

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}