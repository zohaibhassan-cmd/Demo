import './FundingCards.css'

export type FundingCard = {
  id: string
  label: string
  value: string
  linked?: boolean
}

const defaultCards: FundingCard[] = [
  { id: 'obligated', label: 'Total Obligated', value: '$,$$$' },
  { id: 'historical', label: 'Historical Orders', value: '$,$$$', linked: true },
  { id: 'pending', label: 'Pending Orders', value: '$,$$$' },
  { id: 'remaining', label: 'Total Funding Remaining', value: '$$,$$$' },
]

type FundingCardsProps = {
  cards?: FundingCard[]
  clinSelected?: boolean
}

export function FundingCards({
  cards = defaultCards,
  clinSelected = false,
}: FundingCardsProps) {
  return (
    <section className="funding-cards" aria-label="Funding summary">
      {cards.map((card) => (
        <article key={card.id} className="funding-card">
          <h2
            className={
              card.linked
                ? 'funding-card__label funding-card__label--link'
                : 'funding-card__label'
            }
          >
            {card.label}
          </h2>
          <p className="funding-card__value">
            {clinSelected ? card.value : '\u00A0'}
          </p>
        </article>
      ))}
    </section>
  )
}
