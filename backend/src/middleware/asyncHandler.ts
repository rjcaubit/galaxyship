import { Request, Response, NextFunction } from 'express'

/**
 * Envolve handlers async para que rejeições (ex.: DB fora do ar) virem HTTP 500
 * em vez de derrubar o processo Node com unhandledRejection.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('[route error]', err?.message ?? err)
      if (!res.headersSent) res.status(500).json({ error: 'internal_error' })
    })
  }
}
