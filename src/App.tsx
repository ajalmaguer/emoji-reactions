import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { useState, type CSSProperties } from 'react';

const FLOAT_DURATION_MS = 1800;
const PICKER_COLLAPSE_DURATION_MS = 320;
const DEFAULT_REACTIONS = ['1f44d', '2764-fe0f', '1f603', '1f622', '1f64f'];

type Launch = {
  emoji: string;
  id: string;
  sway: number;
  start: number;
};

function App() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [customReaction, setCustomReaction] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState('default-reactions');
  const reactions = customReaction
    ? [...DEFAULT_REACTIONS, customReaction]
    : DEFAULT_REACTIONS;

  function launchEmoji(emoji: string) {
    const id = crypto.randomUUID();
    const sway = Math.round(Math.random() * 18 + 28);
    const start = Math.round(Math.random() * 44 - 22);

    setLaunches((currentLaunches) => [
      ...currentLaunches,
      { emoji, id, start, sway },
    ]);
    window.setTimeout(() => {
      setLaunches((currentLaunches) =>
        currentLaunches.filter((launch) => launch.id !== id),
      );
    }, FLOAT_DURATION_MS);
  }

  function handleReactionClick(emojiData: EmojiClickData) {
    launchEmoji(emojiData.emoji);
  }

  function setLastCustomReaction(emojiUnifiedString: string) {
    if (DEFAULT_REACTIONS.includes(emojiUnifiedString)) {
      return;
    }

    setCustomReaction(emojiUnifiedString);
  }

  function handleEmojiClick(
    emojiData: EmojiClickData,
    _event: MouseEvent,
    api?: { collapseToReactions: () => void },
  ) {
    launchEmoji(emojiData.emoji);
    setLastCustomReaction(emojiData.unified);
    api?.collapseToReactions();

    window.setTimeout(() => {
      setPickerKey(emojiData.unified);
    }, PICKER_COLLAPSE_DURATION_MS);
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.16),transparent_34%),linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]" />

      <section className="relative flex min-h-screen w-full max-w-md flex-col items-center justify-end px-5 pb-10">
        <div className="launch-field" aria-hidden="true">
          {launches.map((launch) => (
            <span
              className="launched-emoji"
              key={launch.id}
              style={
                {
                  '--sway': `${launch.sway}px`,
                  '--start': `${launch.start}px`,
                } as CSSProperties
              }
            >
              <span className="launched-emoji-glyph">{launch.emoji}</span>
            </span>
          ))}
        </div>

        <EmojiPicker
          key={pickerKey}
          onEmojiClick={handleEmojiClick}
          onReactionClick={handleReactionClick}
          reactions={reactions}
          reactionsDefaultOpen
        />
      </section>
    </main>
  );
}

export default App;
