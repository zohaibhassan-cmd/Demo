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

export type DraftLineItem = {
  id: string
  type: string
  ru1: string
  ru2: string
  designatorCode: string
  ccat1: string
  ccat2: string
  unitCost: number
}

export type PlaceOrderDraft = {
  id: string
  bureau: string
  clin: string
  nickname: string
  fundingAvailableBefore: number
  createdAt: string
  step: 'start' | 'selection' | 'review' | 'placed'
  orderType: string | null
  bulkUploadFileName: string | null
  items: DraftLineItem[]
  emailSent: boolean
  orderNumber: string | null
}

export type ReviewOrderPayload = {
  draftId: string
  clin: string
  nickname: string
  orderType: string | null
  fundingAvailableBefore: number
  fundingAvailableBeforeFormatted: string
  fundingAvailableAfter: number
  fundingAvailableAfterFormatted: string
  orderTotal: number
  orderTotalFormatted: string
  cartCount: number
  emailMessage: string
  items: DraftLineItem[]
  step: string
  orderNumber: string | null
  message?: string
  summary?: OrderSummaryPayload
}

export type OrderSummaryCategory = {
  label: string
  count: number
  amount: number
  amountFormatted: string
}

export type OrderSummaryLocation = {
  location: string
  subtotal: number
  subtotalFormatted: string
  phones: OrderSummaryCategory
  tablets: OrderSummaryCategory
  wireless: OrderSummaryCategory
}

export type OrderSummaryPayload = {
  clin: string
  orderNumber: string
  totalItems: number
  orderTotal: number
  orderTotalFormatted: string
  fundingAvailableBefore: number
  fundingAvailableBeforeFormatted: string
  fundingAvailableAfter: number
  fundingAvailableAfterFormatted: string
  emailMessage: string
  categories: OrderSummaryCategory[]
  locations: OrderSummaryLocation[]
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
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
  return sendJson<{
    draft: PlaceOrderDraft
    fundingAvailableBeforeFormatted: string
    message: string
  }>('/api/place-order/start', 'POST', input)
}

export async function selectOrderType(draftId: string, orderType: string) {
  return sendJson<{
    draft: PlaceOrderDraft
    review: ReviewOrderPayload
    fundingAvailableBeforeFormatted: string
    message: string
  }>(`/api/place-order/${draftId}/order-type`, 'POST', { orderType })
}

export async function submitBulkUpload(draftId: string, fileName: string) {
  return sendJson<{
    draft: PlaceOrderDraft
    review: ReviewOrderPayload
    message: string
  }>(`/api/place-order/${draftId}/bulk-upload`, 'POST', { fileName })
}

export async function fetchReviewOrder(draftId: string) {
  return getJson<ReviewOrderPayload>(`/api/place-order/${draftId}/review`)
}

export async function deleteReviewItem(draftId: string, itemId: string) {
  return sendJson<ReviewOrderPayload>(
    `/api/place-order/${draftId}/items/${itemId}`,
    'DELETE',
  )
}

export async function updateReviewItem(
  draftId: string,
  itemId: string,
  patch: Partial<DraftLineItem>,
) {
  return sendJson<ReviewOrderPayload>(
    `/api/place-order/${draftId}/items/${itemId}`,
    'PATCH',
    patch,
  )
}

export async function addReviewItem(draftId: string, item?: Partial<DraftLineItem>) {
  return sendJson<ReviewOrderPayload>(`/api/place-order/${draftId}/items`, 'POST', item ?? {})
}

export async function placeReviewOrder(draftId: string) {
  return sendJson<ReviewOrderPayload>(`/api/place-order/${draftId}/place`, 'POST', {})
}

export async function fetchOrderSummary(draftId: string) {
  return getJson<OrderSummaryPayload>(`/api/place-order/${draftId}/summary`)
}
