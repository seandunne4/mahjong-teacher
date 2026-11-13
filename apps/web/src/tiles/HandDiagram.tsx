import { useMemo } from 'react';
import { parseHand, type HandSection } from '@mj/engine';
import { Tile } from './Tile';

/**
 * Renders hand notation ("123m 555p* 1111s! | 77z").
 * Exposed melds show the claimed (last) tile turned sideways; concealed kongs
 * show their end tiles face down; "|" separates groups with a gap.
 */
export function HandDiagram({ hand, size = 34, caption, label }: { hand: string; size?: number; caption?: string; label?: string }) {
  const parsed = useMemo<HandSection[] | Error>(() => {
    try {
      return parseHand(hand);
    } catch (e) {
      return e as Error;
    }
  }, [hand]);

  if (parsed instanceof Error) return <span className="error">Bad diagram "{hand}": {parsed.message}</span>;

  return (
    <figure className="hand-diagram" aria-label={label ?? caption ?? hand}>
      <div className="hand-sections">
        {parsed.map((section, si) => (
          <div className="hand-section" key={si}>
            {section.map((meld, mi) => (
              <div className={`meld meld-${meld.mark}`} key={mi} title={meld.mark === 'exposed' ? 'Exposed (claimed)' : meld.mark === 'concealedKong' ? 'Concealed kong' : undefined}>
                {meld.tiles.map((id, ti) => {
                  const last = ti === meld.tiles.length - 1;
                  const faceDown = meld.mark === 'concealedKong' && (ti === 0 || last);
                  const rotated = meld.mark === 'exposed' && last;
                  return <Tile key={ti} id={id} size={size} faceDown={faceDown} rotated={rotated} badges={false} />;
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
