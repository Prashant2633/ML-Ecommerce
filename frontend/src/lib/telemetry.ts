// Telemetry client - captures user behaviour signals to compute popularity-based recommendations.
// Sends click, add_to_cart, purchase, and view events to the backend API.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sessionId = sessionStorage.getItem('nexcart_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem('nexcart_session_id', sessionId)
  }
  return sessionId
}

export type ActionType = 'view' | 'click' | 'add_to_cart' | 'purchase'

interface TelemetryEvent {
  product_id: number
  action_type: ActionType
  session_id: string
  user_id?: number
}

export async function track(productId: number, actionType: ActionType, userId?: number) {
  const event: TelemetryEvent = {
    product_id: productId,
    action_type: actionType,
    session_id: getOrCreateSessionId(),
    user_id: userId,
  }
  try {
    await fetch(`${API_URL}/api/telemetry/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true, // Non-blocking, fire-and-forget
    })
  } catch {
    // Silently fail — telemetry must never break the UI
  }
}

export async function fetchRecommendations(userId: number, productId?: number): Promise<number[]> {
  try {
    const sessionId = getOrCreateSessionId()
    let url = `${API_URL}/api/recommendations/${userId}?session_id=${sessionId}`
    if (productId !== undefined) {
      url += `&product_id=${productId}`
    }
    const res = await fetch(url)
    const data = await res.json()
    return data.recommendations || []
  } catch {
    return []
  }
}
