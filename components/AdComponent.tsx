'use client'

import { useEffect, useState } from 'react'

interface AdComponentProps {
  publisherId?: string | null
  slotId?: string | null
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
  responsive?: boolean
  label?: string
  placeholderText?: string
}

export default function AdComponent({
  publisherId,
  slotId,
  format = 'auto',
  responsive = true,
  label = 'Sponsored Content',
  placeholderText = 'Advertise with us • premium placements available'
}: AdComponentProps) {
  const [adFailed, setAdFailed] = useState(false)
  const [hasAdSense, setHasAdSense] = useState(false)

  useEffect(() => {
    if (publisherId && slotId) {
      setHasAdSense(true)
      try {
        // Inject Google AdSense script dynamically if not already injected
        const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]')
        if (!existingScript) {
          const script = document.createElement('script')
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
          script.async = true
          script.crossOrigin = 'anonymous'
          document.head.appendChild(script)
        }

        // Push ads to Google Queue
        // @ts-ignore
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error('AdSense script initialization failed:', err)
        setAdFailed(true)
      }
    } else {
      setHasAdSense(false)
    }
  }, [publisherId, slotId])

  // If no AdSense credentials or script fails, show a beautiful premium mock sponsor slot!
  // This is extremely professional and ensures the UI never looks empty or broken.
  if (!hasAdSense || adFailed) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-100/50 dark:bg-zinc-900/30 p-4 transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500/30 to-purple-500/20" />
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest select-none">
            {label}
          </span>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs font-bold leading-normal max-w-sm">
            {placeholderText}
          </p>
          <div className="pt-2">
            <a 
              href="mailto:admin@kayhanayas.com?subject=Premium Ad Slot Inquiry"
              className="inline-flex items-center justify-center px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Partner With Us
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center py-4 space-y-2 select-none">
      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
        {label}
      </span>
      <div className="w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-xl min-h-[100px]">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={publisherId || ''}
          data-ad-slot={slotId || ''}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  )
}
