import EmojiPicker from 'emoji-picker-react';
import { resetReactions } from './db';

const DEFAULT_REACTIONS = [
  '1f422',
  '1f9d1-200d-1f680',
  '1f680',
  '1f916',
  '1f973',
];

function App() {
  const totalReactions = 0;

  function handleEmojiClick() {
    console.log('handleEmojiClick');
  }

  function handleReactionClick() {
    console.log('handleReactionClick');
  }

  async function handleReset() {
    await resetReactions();
  }

  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.16),transparent_34%),linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]" />

      <section className="relative flex min-h-svh w-full max-w-md flex-col items-center justify-end px-5 pb-10">
        <div className="reaction-meter" aria-live="polite">
          <div className="reaction-meter-header">
            <span>Live reactions</span>
            <div className="reaction-meter-actions">
              <button
                className="reaction-reset-button"
                onClick={handleReset}
                type="button"
              >
                Reset
              </button>
              <strong>{totalReactions}</strong>
            </div>
          </div>

          <div className="reaction-meter-list">top reactions go here</div>
        </div>

        <div className="launch-field" aria-hidden="true">
          launches go here
        </div>

        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          onReactionClick={handleReactionClick}
          reactions={DEFAULT_REACTIONS}
          reactionsDefaultOpen
          allowExpandReactions={false}
        />
      </section>
    </main>
  );
}

export default App;
