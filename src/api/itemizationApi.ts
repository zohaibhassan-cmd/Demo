export type ItemizationLine = {
  id: string
  type: string
  nid: string
  poc: string
  designatorCode: string
  stat1: string
  stat2: string
  unitCost: number
}

export type ItemizationCategory = {
  label: string
  count: number
  amount: number
  amountFormatted: string
}

export type ItemizationPayload = {
  orderId: string
  orderNumber: string
  clin: string
  orderStatus: string
  title: string
  lines: ItemizationLine[]
  totalItems: number
  orderTotal: number
  orderTotalFormatted: string
  categories: ItemizationCategory[]
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

export async function fetchItemization(orderId: string) {
  return getJson<ItemizationPayload>(`/api/orders/${orderId}/itemization`)
}

export async function updateItemizationLine(
  orderId: string,
  lineId: string,
  patch: Partial<ItemizationLine>,
) {
  return sendJson<ItemizationPayload>(
    `/api/orders/${orderId}/itemization/${lineId}`,
    'PATCH',
    patch,
  )
}

export async function deleteItemizationLine(orderId: string, lineId: string) {
  return sendJson<ItemizationPayload>(
    `/api/orders/${orderId}/itemization/${lineId}`,
    'DELETE',
  )
}
