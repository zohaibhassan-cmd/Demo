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

export const pendingOrders: OrderRow[] = [
  {
    id: 'p1',
    orderDate: '03/12/25',
    orderNumber: 'FWS101',
    nickname: 'New program setup',
    clin: '0001AA',
    totalItems: '12',
    totalPopCost: '$4,280',
    orderedBy: 'j.smith@gov',
  },
  {
    id: 'p2',
    orderDate: '03/14/25',
    orderNumber: 'FWS102',
    nickname: 'Regional refresh',
    clin: '0001AA',
    totalItems: '8',
    totalPopCost: '$2,640',
    orderedBy: 'a.lee@gov',
  },
  {
    id: 'p3',
    orderDate: '03/18/25',
    orderNumber: 'FWS103',
    nickname: 'Field kit restock',
    clin: '0002BB',
    totalItems: '24',
    totalPopCost: '$7,100',
    orderedBy: 'm.diaz@gov',
  },
  {
    id: 'p4',
    orderDate: '03/20/25',
    orderNumber: 'FWS104',
    nickname: 'Pilot devices',
    clin: '0001AA',
    totalItems: '5',
    totalPopCost: '$1,850',
    orderedBy: 'k.nguyen@gov',
  },
]

export const historicalOrders: OrderRow[] = [
  {
    id: 'h1',
    orderDate: '01/08/25',
    orderNumber: 'FWS088',
    nickname: 'Order for SC',
    clin: '0001AA',
    totalItems: '18',
    totalPopCost: '$5,420',
    orderedBy: 'j.smith@gov',
  },
  {
    id: 'h2',
    orderDate: '01/22/25',
    orderNumber: 'FWS091',
    nickname: 'Last phone',
    clin: '0002BB',
    totalItems: '3',
    totalPopCost: '$990',
    orderedBy: 'a.lee@gov',
  },
  {
    id: 'h3',
    orderDate: '02/05/25',
    orderNumber: 'FWS095',
    nickname: '10-person new hire',
    clin: '0001AA',
    totalItems: '30',
    totalPopCost: '$9,600',
    orderedBy: 'm.diaz@gov',
  },
  {
    id: 'h4',
    orderDate: '02/19/25',
    orderNumber: 'FWS098',
    nickname: 'Upgrades for Program XYZ',
    clin: '0003CC',
    totalItems: '15',
    totalPopCost: '$6,750',
    orderedBy: 'k.nguyen@gov',
  },
]
