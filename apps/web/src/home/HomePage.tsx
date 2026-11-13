import { Link } from 'react-router';
import { Tile } from '../tiles/Tile';
import { ActiveRulesBadge } from '../settings/ActiveRulesBadge';

const CARDS = [
  { to: '/tiles', title: 'Tile atlas', text: 'What every tile is called, how to read the Chinese, and the numeral decoder.' },
  { to: '/setup', title: 'Set up a game', text: 'Seats, dice, walls, the dead wall and the deal, step by step on an animated table.' },
  { to: '/rules', title: 'Rules reference', text: 'Sets, claiming, turns, winning and game flow, with a tile diagram for every rule.' },
  { to: '/fan', title: 'Fan chart', text: 'All scoring patterns from 88 fan down to 1, with example hands.' },
  { to: '/glossary', title: 'Table talk', text: 'chī, pèng, gàng, hú: the words people say out loud, with audio.' },
];

export function HomePage() {
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-tiles" aria-hidden>
          {['1z', '2z', '3z', '4z', '7z', '6z', '5z'].map((id) => (
            <Tile key={id} id={id} size={54} badges={false} />
          ))}
        </div>
        <h1>Mahjong Teacher</h1>
        <p className="lead">Learn Chinese Mahjong from scratch, or look something up mid-game. Rules follow the Yellow Mountain Imports booklet.</p>
        <ActiveRulesBadge />
      </section>
      <div className="home-cards">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="card home-card">
            <h2>{c.title}</h2>
            <p>{c.text}</p>
          </Link>
        ))}
      </div>
      <section className="card start-here">
        <h2>New to Mahjong? Start here</h2>
        <ol>
          <li>Learn to <Link to="/tiles">recognise the tiles</Link>, especially the Characters.</li>
          <li>Read <Link to="/rules/sets">sets: chow, pung, kong</Link>.</li>
          <li>Walk through <Link to="/setup">setting up a game</Link> with real tiles beside you.</li>
          <li>Keep <Link to="/rules/claiming">claiming</Link> open during your first games.</li>
        </ol>
      </section>
    </div>
  );
}
