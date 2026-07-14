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
  step: 'start' | 'selection' | 'form' | 'review' | 'placed'
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

export type NewOrderOptions = {
  ru1: string[]
  ru2: string[]
  bureauDesignator: string[]
  ccat1: string[]
  ccat2: string[]
  ccat3: string[]
  restrictedReporting: string[]
  signatureRequired: string[]
  addressLine1: string[]
  addressLine2: string[]
  zips: string[]
  unitCost: number
}

export type NewOrderContext = {
  draftId: string
  clin: string
  bureau: string
  nickname: string
  orderType: string
  fundingAvailableBeforeFormatted: string
  unitCostFormatted: string
  costRemainingForClinFormatted: string
  cartCount: number
  unitCost: number
}

export type NewOrderItemInput = {
  firstName: string
  lastName: string
  email: string
  ru1: string
  ru2: string
  bureauDesignator: string
  ccat1: string
  ccat2: string
  ccat3: string
  restrictedReporting: string
  requestedDeliveryDate: string
  shipAddress1: string
  shipAddress2: string
  shipZip: string
  shipCity: string
  shipState: string
  addToAddressBook: boolean
  setAsDefault: boolean
  sameAsShipping: boolean
  dutyAddress1: string
  dutyAddress2: string
  dutyZip: string
  dutyCity: string
  dutyState: string
  signatureRequired: string
  deliveryInstructions: string
  unitCost: number
}

export async function fetchNewOrderOptions() {
  return getJson<NewOrderOptions>('/api/place-order/new-order/options')
}

export async function fetchNewOrderContext(draftId: string) {
  return getJson<NewOrderContext>(`/api/place-order/${draftId}/new-order-context`)
}

export async function lookupZip(zip: string) {
  return getJson<{ zip: string; city: string; state: string }>(`/api/place-order/zip/${zip}`)
}

export async function submitNewOrderItem(draftId: string, input: NewOrderItemInput) {
  return sendJson<{
    cartCount: number
    costRemainingForClinFormatted: string
    message: string
    review: ReviewOrderPayload
  }>(`/api/place-order/${draftId}/new-order-item`, 'POST', input)
}

export type InternationalPassOptions = {
  piuNickname: string[]
  bureauDesignator: string[]
  unitCost: number
}

export type HistoricalPassRow = {
  orderNumber: string
  passStartDate: string
  passEndDate: string
}

export type InternationalPassContext = {
  draftId: string
  clin: string
  bureau: string
  nickname: string
  orderType: string
  fundingAvailableBeforeFormatted: string
  unitCost: number
  unitCostFormatted: string
  costRemainingForPopFormatted: string
  cartCount: number
  historicalPasses: HistoricalPassRow[]
}

export type InternationalPassItemInput = {
  mobileNumber: string
  firstName: string
  lastName: string
  email: string
  piuNickname1: string
  piuNickname2: string
  bureauDesignator: string
  sameEmailDomain: boolean
  requireWithinWindow: boolean
  passStartDate: string
  passEndDate: string
  unitCost: number
}

export async function fetchInternationalPassOptions() {
  return getJson<InternationalPassOptions>('/api/place-order/international-pass/options')
}

export async function fetchInternationalPassContext(draftId: string) {
  return getJson<InternationalPassContext>(
    `/api/place-order/${draftId}/international-pass-context`,
  )
}

export async function submitInternationalPassItem(
  draftId: string,
  input: InternationalPassItemInput,
) {
  return sendJson<{
    cartCount: number
    costRemainingForPopFormatted: string
    message: string
    review: ReviewOrderPayload
  }>(`/api/place-order/${draftId}/international-pass-item`, 'POST', input)
}

export type ReplaceUpgradeOptions = {
  puiNickname: string[]
  bureauDesignator: string[]
  eca1: string[]
  eca2: string[]
  eca3: string[]
  restrictedReporting: string[]
  signatureRequired: string[]
  addressLine1: string[]
  addressLine2: string[]
  zips: string[]
  unitCost: number
  initialMaintenanceUnitCost: number
}

export type ReplaceUpgradeContext = {
  draftId: string
  clin: string
  bureau: string
  nickname: string
  orderType: string
  fundingAvailableBeforeFormatted: string
  unitCost: number
  unitCostFormatted: string
  initialMaintenanceUnitCost: number
  initialMaintenanceUnitCostFormatted: string
  costRemainingForClinFormatted: string
  cartCount: number
  whatThisMeans: string
  note: string
}

export type ReplaceUpgradeItemInput = {
  firstName: string
  lastName: string
  email: string
  puiNickname1: string
  puiNickname2: string
  bureauDesignator: string
  eca1: string
  eca2: string
  eca3: string
  restrictedReporting: string
  requestedDeliveryDate: string
  shipAddress1: string
  shipAddress2: string
  shipZip: string
  shipCity: string
  shipState: string
  setAsStandardAddress: boolean
  setAsShipToDefault: boolean
  signatureRequired: string
  deliveryInstructions: string
  unitCost: number
}

export async function fetchReplaceUpgradeOptions() {
  return getJson<ReplaceUpgradeOptions>('/api/place-order/replace-upgrade/options')
}

export async function fetchReplaceUpgradeContext(draftId: string) {
  return getJson<ReplaceUpgradeContext>(`/api/place-order/${draftId}/replace-upgrade-context`)
}

export async function submitReplaceUpgradeItem(
  draftId: string,
  input: ReplaceUpgradeItemInput,
) {
  return sendJson<{
    cartCount: number
    costRemainingForClinFormatted: string
    message: string
    review: ReviewOrderPayload
  }>(`/api/place-order/${draftId}/replace-upgrade-item`, 'POST', input)
}

export type SuspendOptions = {
  ru1Nickname: string[]
  ru2Nickname: string[]
  devicesDesignator: string[]
  unitCost: number
}

export type HistoricalSuspendRow = {
  orderNumber: string
  suspendDays: number
  startDate: string
  resumeDate: string
}

export type SuspendContext = {
  draftId: string
  clin: string
  bureau: string
  nickname: string
  orderType: string
  fundingAvailableBeforeFormatted: string
  unitCost: number
  unitCostFormatted: string
  costRemainingForPopFormatted: string
  cartCount: number
  historicalSuspends: HistoricalSuspendRow[]
}

export type SuspendItemInput = {
  mobileNumber: string
  firstName: string
  lastName: string
  email: string
  ru1Nickname: string
  ru2Nickname: string
  devicesDesignator: string
  useEmailForNotifications: boolean
  suspendStartDate: string
  suspendEndDate: string
  unitCost: number
}

export async function fetchSuspendOptions() {
  return getJson<SuspendOptions>('/api/place-order/suspend/options')
}

export async function fetchSuspendContext(draftId: string) {
  return getJson<SuspendContext>(`/api/place-order/${draftId}/suspend-context`)
}

export async function submitSuspendItem(draftId: string, input: SuspendItemInput) {
  return sendJson<{
    cartCount: number
    costRemainingForPopFormatted: string
    message: string
    review: ReviewOrderPayload
  }>(`/api/place-order/${draftId}/suspend-item`, 'POST', input)
}
