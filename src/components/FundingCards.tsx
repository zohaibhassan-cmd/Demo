import './FundingCards.css'
import type { FundingCard } from '../api/ordersApi'

type FundingCardsProps = {
  cards: FundingCard[]
  clinSelected: boolean
}

export function FundingCards({ cards, clinSelected }: FundingCardsProps) {
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
            {clinSelected && card.value ? card.value : '\u00A0'}
          </p>
        </article>
      ))}
    </section>
  )
}
