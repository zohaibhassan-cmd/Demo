export type AdminFilterValues = {
  bureau: string
  contractNumber: string
  pop: string
  clin: string
}

export type AdminFilterOptions = {
  bureau: string[]
  contractNumber: string[]
  pop: string[]
  clin: string[]
}

export type AdminOrderRow = {
  id: string
  orderNumber: string
  orderDate: string
  clin: string
  totalPopCost: string
  earliestRequestDate: string | null
  toVendorDate: string | null
  orderedBy: string
}

function toQuery(filters: AdminFilterValues, search = '') {
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

export async function fetchAdminFilterOptions() {
  return getJson<AdminFilterOptions>('/api/filters/admin')
}

export async function fetchAdminOrders(
  status: 'pending' | 'historical',
  filters: AdminFilterValues,
  search = '',
) {
  const query = toQuery(filters, search)
  return getJson<{ status: string; count: number; rows: AdminOrderRow[] }>(
    `/api/orders/admin/${status}?${query}`,
  )
}

export function exportAdminOrdersUrl(
  status: 'pending' | 'historical',
  filters: AdminFilterValues,
  search = '',
) {
  return `/api/orders/admin/export/${status}?${toQuery(filters, search)}`
}
