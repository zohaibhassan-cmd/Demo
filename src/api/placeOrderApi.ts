export type PlaceOrderOptions = {
  bureau: string[]
  clin: string[]
  orderTypes: string[]
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
  step: 'start' | 'selection' | 'form'
  orderType: string | null
  bulkUploadFileName: string | null
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`)
  }
  return data
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
  return postJson<{
    draft: PlaceOrderDraft
    fundingAvailableBeforeFormatted: string
    message: string
  }>('/api/place-order/start', input)
}

export async function selectOrderType(draftId: string, orderType: string) {
  return postJson<{
    draft: PlaceOrderDraft
    fundingAvailableBeforeFormatted: string
    message: string
  }>(`/api/place-order/${draftId}/order-type`, { orderType })
}

export async function submitBulkUpload(draftId: string, fileName: string) {
  return postJson<{
    draft: PlaceOrderDraft
    message: string
  }>(`/api/place-order/${draftId}/bulk-upload`, { fileName })
}
