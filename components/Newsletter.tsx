'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.')
      }

      const { error } = await supabase
        .from('newsletter')
        .insert([{ email: email.toLowerCase().trim() }])

      if (error) {
        if (error.code === '23505') { // Unique constraint violation in PostgreSQL
          throw new Error('This email is already subscribed to our newsletter!')
        }
        throw error
      }

      setStatus({
        type: 'success',
        text: 'Thank you! You have successfully subscribed to our newsletter.',
      })
      setEmail('')
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err.message || 'Failed to subscribe. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/60 p-8 sm:p-10 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/60 dark:to-zinc-950/80 shadow-xl">
      {/* Decorative Blur Background */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center space-y-6">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Subscribe to <span className="gradient-text font-black">kayhanayas.com</span> Newsletter
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Stay ahead of the curve. Get premium articles, high-income CPM strategies, and tech insights delivered straight to your inbox.
        </p>

        {status && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm max-w-md mx-auto animate-in fade-in slide-in-from-top-2 duration-300 ${
            status.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="font-medium text-left">{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your professional email"
            className="flex-grow px-5 py-3.5 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Subscribe
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Zero spam. Unsubscribe at any time. We respect your privacy.
        </p>
      </div>
    </div>
  )
}
