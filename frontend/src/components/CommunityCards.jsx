import Card from './Card';

export default function CommunityCards({ cards, animationKey }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {cards.map((card, index) => (
        <Card
          key={`${animationKey}-community-${index}-${card || 'empty'}`}
          card={card}
          placeholder={!card}
          delay={index * 70}
        />
      ))}
    </div>
  );
}
