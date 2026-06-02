/**
 * Supabase queries için timeout wrapper
 * Promise.race() kullanarak max 5 saniye sonra timeout atar
 */

export class TimeoutError extends Error {
  constructor(message = 'Request timed out after 5 seconds') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  )

  return Promise.race([promise, timeoutPromise])
}

/**
 * Supabase query response'ını handle et
 * Error ve data'yı kontrol et
 */
export function handleSupabaseResponse<T>(response: { data: T | null; error: any }): T {
  if (response.error) {
    throw response.error
  }
  if (!response.data) {
    throw new Error('No data returned from database')
  }
  return response.data
}

/**
 * Session validation timeout ile
 */
export async function getSessionWithTimeout(supabase: any): Promise<any> {
  // DÜZELTİLEN KISIM: 'as any' eklenerek response nesnesinin tipi belirtildi ve unknown hatası giderildi.
  const response = await withTimeout(
    supabase.auth.getSession(),
    3000
  ) as any

  if (response.error) {
    throw response.error
  }

  return response.data?.session
}

/**
 * Debug helper: request başlangıç ve bitişini log et
 */
export function logSupabaseRequest(operation: string, userId?: string) {
  const timestamp = new Date().toISOString()
  const userInfo = userId ? ` [User: ${userId.substring(0, 8)}...]` : ''
  console.log(`[${timestamp}] Supabase: ${operation}${userInfo}`)

  return () => {
    const endTime = new Date().toISOString()
    console.log(`[${endTime}] Supabase: ${operation} completed`)
  }
}

/**
 * RLS Policy error mu değil mi kontrol et
 */
export function isRLSError(error: any): boolean {
  return error?.code === '42501' ||
         error?.message?.includes('RLS policy') ||
         error?.message?.includes('permission denied')
}

/**
 * Network error mu kontrol et
 */
export function isNetworkError(error: any): boolean {
  return error instanceof TimeoutError ||
         error?.message?.includes('network') ||
         error?.message?.includes('timeout') ||
         error?.code === 'ECONNREFUSED'
}

/**
 * Database constraint error mu kontrol et (e.g., unique violation)
 */
export function isConstraintError(error: any): boolean {
  return error?.code === '23505' || // Unique violation
         error?.code === '23502' || // Not null violation
         error?.code === '23503' || // Foreign key violation
         error?.code === '23514'    // Check violation
}