export type OrderRow = {
  id: string
  orderDate: string
  orderNumber: string
  nickname: string
  clin: string
  totalItems: string
  totalPopCost: string
  orderedBy: string
}

export type FilterOptions = {
  bureau: string[]
  clin: string[]
  ru1: string[]
  ru2: string[]
}

export type FilterValues = {
  bureau: string
  clin: string
  ru1: string
  ru2: string
}

export type FundingCard = {
  id: string
  label: string
  value: string | null
  linked?: boolean
}

function toQuery(filters: FilterValues, search = '') {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  if (search.trim()) params.set('search', search.trim())
  return params.toString()
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function fetchFilterOptions() {
  return getJson<FilterOptions>('/api/filters')
}

export async function fetchFunding(clin: string) {
  const params = new URLSearchParams({ clin })
  return getJson<{ clinSelected: boolean; cards: FundingCard[] }>(
    `/api/funding?${params}`,
  )
}

export async function fetchOrders(
  status: 'pending' | 'historical',
  filters: FilterValues,
  search = '',
) {
  const query = toQuery(filters, search)
  return getJson<{ status: string; count: number; rows: OrderRow[] }>(
    `/api/orders/${status}?${query}`,
  )
}

export async function fetchCartCount() {
  const data = await getJson<{ count: number }>('/api/cart')
  return data.count
}

export function exportOrdersUrl(
  status: 'pending' | 'historical',
  filters: FilterValues,
  search = '',
) {
  return `/api/orders/export/${status}?${toQuery(filters, search)}`
}
