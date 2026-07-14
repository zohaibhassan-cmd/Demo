export type OrderStatus = 'pending' | 'historical'

export type Order = {
  id: string
  status: OrderStatus
  orderDate: string
  orderNumber: string
  nickname: string
  clin: string
  bureau: string
  ru1: string
  ru2: string
  contractNumber: string
  pop: string
  earliestRequestDate: string | null
  toVendorDate: string | null
  totalItems: number
  totalPopCost: number
  orderedBy: string
}

export type FundingByClin = {
  clin: string
  totalObligated: number
  historicalOrders: number
  pendingOrders: number
  totalFundingRemaining: number
}

export const filterOptions = {
  bureau: ['FWS', 'NPS', 'BLM'],
  clin: ['0001AA', '0002BB', '0003CC'],
  ru1: ['Iowa - ANRS', 'Alabama - COLE', 'North Carolina - AFAC'],
  ru2: ['ANRS', 'COLE', 'AFAC'],
}

export const adminFilterOptions = {
  bureau: ['FWS', 'NPS', 'BLM'],
  contractNumber: ['47QTCA20D0001', '47QTCA21D0012', '47QTCA22D0033'],
  pop: [
    'Base 3/15/25-3/14/26',
    'Option 1 3/15/26-3/14/27',
    'Option 2 3/15/27-3/14/28',
  ],
  clin: ['0001AA', '0002BB', '0003CC'],
}

export const fundingByClin: FundingByClin[] = [
  {
    clin: '0001AA',
    totalObligated: 1250000,
    historicalOrders: 842500,
    pendingOrders: 8770,
    totalFundingRemaining: 398730,
  },
  {
    clin: '0002BB',
    totalObligated: 680000,
    historicalOrders: 990,
    pendingOrders: 7100,
    totalFundingRemaining: 671910,
  },
  {
    clin: '0003CC',
    totalObligated: 410000,
    historicalOrders: 6750,
    pendingOrders: 0,
    totalFundingRemaining: 403250,
  },
]

export const orders: Order[] = [
  {
    id: 'p1',
    status: 'pending',
    orderDate: '03/12/25',
    orderNumber: 'FWS101',
    nickname: 'New program setup',
    clin: '0001AA',
    bureau: 'FWS',
    ru1: 'Iowa - ANRS',
    ru2: 'ANRS',
    contractNumber: '47QTCA20D0001',
    pop: 'Base 3/15/25-3/14/26',
    earliestRequestDate: '03/20/25',
    toVendorDate: null,
    totalItems: 12,
    totalPopCost: 4280,
    orderedBy: 'j.smith@gov',
  },
  {
    id: 'p2',
    status: 'pending',
    orderDate: '03/14/25',
    orderNumber: 'FWS102',
    nickname: 'Regional refresh',
    clin: '0001AA',
    bureau: 'FWS',
    ru1: 'Alabama - COLE',
    ru2: 'COLE',
    contractNumber: '47QTCA20D0001',
    pop: 'Base 3/15/25-3/14/26',
    earliestRequestDate: '03/22/25',
    toVendorDate: null,
    totalItems: 8,
    totalPopCost: 2640,
    orderedBy: 'a.lee@gov',
  },
  {
    id: 'p3',
    status: 'pending',
    orderDate: '03/18/25',
    orderNumber: 'FWS103',
    nickname: 'Field kit restock',
    clin: '0002BB',
    bureau: 'NPS',
    ru1: 'North Carolina - AFAC',
    ru2: 'AFAC',
    contractNumber: '47QTCA21D0012',
    pop: 'Option 1 3/15/26-3/14/27',
    earliestRequestDate: '03/25/25',
    toVendorDate: null,
    totalItems: 24,
    totalPopCost: 7100,
    orderedBy: 'm.diaz@gov',
  },
  {
    id: 'p4',
    status: 'pending',
    orderDate: '03/20/25',
    orderNumber: 'FWS104',
    nickname: 'Pilot devices',
    clin: '0001AA',
    bureau: 'FWS',
    ru1: 'Iowa - ANRS',
    ru2: 'ANRS',
    contractNumber: '47QTCA22D0033',
    pop: 'Base 3/15/25-3/14/26',
    earliestRequestDate: '03/28/25',
    toVendorDate: null,
    totalItems: 5,
    totalPopCost: 1850,
    orderedBy: 'k.nguyen@gov',
  },
  {
    id: 'h1',
    status: 'historical',
    orderDate: '01/08/25',
    orderNumber: 'FWS088',
    nickname: 'Order for SC',
    clin: '0001AA',
    bureau: 'FWS',
    ru1: 'Iowa - ANRS',
    ru2: 'ANRS',
    contractNumber: '47QTCA20D0001',
    pop: 'Base 3/15/25-3/14/26',
    earliestRequestDate: null,
    toVendorDate: '01/15/25',
    totalItems: 18,
    totalPopCost: 5420,
    orderedBy: 'j.smith@gov',
  },
  {
    id: 'h2',
    status: 'historical',
    orderDate: '01/22/25',
    orderNumber: 'FWS091',
    nickname: 'Last phone',
    clin: '0002BB',
    bureau: 'NPS',
    ru1: 'Alabama - COLE',
    ru2: 'COLE',
    contractNumber: '47QTCA21D0012',
    pop: 'Option 1 3/15/26-3/14/27',
    earliestRequestDate: null,
    toVendorDate: '01/30/25',
    totalItems: 3,
    totalPopCost: 990,
    orderedBy: 'a.lee@gov',
  },
  {
    id: 'h3',
    status: 'historical',
    orderDate: '02/05/25',
    orderNumber: 'FWS095',
    nickname: '10-person new hire',
    clin: '0001AA',
    bureau: 'FWS',
    ru1: 'North Carolina - AFAC',
    ru2: 'AFAC',
    contractNumber: '47QTCA20D0001',
    pop: 'Base 3/15/25-3/14/26',
    earliestRequestDate: null,
    toVendorDate: '02/12/25',
    totalItems: 30,
    totalPopCost: 9600,
    orderedBy: 'm.diaz@gov',
  },
  {
    id: 'h4',
    status: 'historical',
    orderDate: '02/19/25',
    orderNumber: 'FWS098',
    nickname: 'Upgrades for Program XYZ',
    clin: '0003CC',
    bureau: 'BLM',
    ru1: 'Alabama - COLE',
    ru2: 'COLE',
    contractNumber: '47QTCA22D0033',
    pop: 'Option 2 3/15/27-3/14/28',
    earliestRequestDate: null,
    toVendorDate: '02/28/25',
    totalItems: 15,
    totalPopCost: 6750,
    orderedBy: 'k.nguyen@gov',
  },
]
