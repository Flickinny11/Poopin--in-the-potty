interface VidLiSyncLogoProps {
  className?: string
  variant?: 'full' | 'icon'
  size?: number
}

export const VidLiSyncLogo = ({ 
  className = '', 
  variant = 'full', 
  size = 40 
}: VidLiSyncLogoProps) => {
  const iconSize = variant === 'icon' ? size : size
  const textSize = variant === 'icon' ? 0 : size * 0.6

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vidlisync-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        
        {/* Video play icon with translation waves */}
        <rect
          x="4"
          y="4"
          width="32"
          height="32"
          rx="8"
          fill="url(#vidlisync-gradient)"
          className="drop-shadow-lg"
        />
        
        {/* Play triangle */}
        <path
          d="M15 12 L15 28 L26 20 Z"
          fill="white"
          className="opacity-90"
        />
        
        {/* Translation waves */}
        <path
          d="M12 8 Q20 6 28 8"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="opacity-70"
          fill="none"
        />
        <path
          d="M12 32 Q20 34 28 32"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="opacity-70"
          fill="none"
        />
      </svg>
      
      {variant === 'full' && (
        <span 
          className="font-bold text-gray-900 tracking-tight"
          style={{ fontSize: textSize }}
        >
          VidLiSync
        </span>
      )}
    </div>
  )
}