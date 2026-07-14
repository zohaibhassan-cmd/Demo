export type PlaceOrderOptions = {
  bureau: string[]
  clin: string[]
}

export type PlaceOrderFunding = {
  clin: string | null
  bureau: string | null
  totalFundingAvailableBefore: number
  totalFundingAvailableBeforeFormatted: string
}

export type PlaceOrderDraft = {
  id: string
  bureau: string
  clin: string
  nickname: string
  fundingAvailableBefore: number
  createdAt: string
  step: 'start' | 'selection'
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function fetchPlaceOrderOptions() {
  return getJson<PlaceOrderOptions>('/api/place-order/options')
}

export async function fetchPlaceOrderFunding(bureau: string, clin: string) {
  const params = new URLSearchParams()
  if (bureau) params.set('bureau', bureau)
  if (clin) params.set('clin', clin)
  return getJson<PlaceOrderFunding>(`/api/place-order/funding-available?${params}`)
}

export async function startPlaceOrder(input: {
  bureau: string
  clin: string
  nickname: string
}) {
  const response = await fetch('/api/place-order/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = (await response.json()) as {
    draft?: PlaceOrderDraft
    fundingAvailableBeforeFormatted?: string
    message?: string
    error?: string
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to start place order')
  }

  return data as {
    draft: PlaceOrderDraft
    fundingAvailableBeforeFormatted: string
    message: string
  }
}
