// Rate limiter utility for API calls

export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class RateLimiter {
  private lastCallTime = 0
  private delayMs: number

  constructor(delayMs: number) {
    this.delayMs = delayMs
  }

  async throttle(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCallTime
    
    if (timeSinceLastCall < this.delayMs) {
      const waitTime = this.delayMs - timeSinceLastCall
      await wait(waitTime)
    }
    
    this.lastCallTime = Date.now()
  }
}