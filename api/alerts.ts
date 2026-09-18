type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void }

/** Placeholder for a future Vercel Cron endpoint. Business rules remain in the shared frontend service until a database exists. */
export default function handler(request: { method?: string }, response: ApiResponse) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' })
  return response.status(200).json({ ready: true, message: 'Escalonamento preparado para execução diária via Vercel Cron.' })
}
