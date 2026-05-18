import type { CSSProperties } from 'react';

export type ReactionType = {
  id: string;
  emoji: string;
  // sway: number;
  start: number;
};

export function Reaction(reaction: ReactionType) {
  return (
    <span
      className="launched-emoji"
      key={reaction.id}
      style={
        {
          // '--sway': `${25}px`,
          '--start': `${reaction.start}px`,
        } as CSSProperties
      }
    >
      <span className="launched-emoji-glyph">{reaction.emoji}</span>
    </span>
  );
}
