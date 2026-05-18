import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { Tables } from './database.types';
import { hasSupabaseConfig, supabase } from './supabaseClient';

const FLOAT_DURATION_MS = 1800;
const PICKER_COLLAPSE_DURATION_MS = 320;
// const DEFAULT_REACTIONS = ['1f7e2', '1f7e1', '1f534', '1f914', '1f64b'];
const DEFAULT_REACTIONS = ['1f680', '1f331', '1f9e9', '1f914', '1f64b'];

type Launch = {
  emoji: string;
  id: string;
  sway: number;
  start: number;
};

type ReactionCountRow = Tables<'reaction_counts'>;

function App() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    {},
  );
  const pendingLocalReactions = useRef<Record<string, number>>({});
  const [customReaction, setCustomReaction] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState('default-reactions');
  const reactions = customReaction
    ? [...DEFAULT_REACTIONS, customReaction]
    : DEFAULT_REACTIONS;
  const topReactions = useMemo(
    () =>
      Object.entries(reactionCounts)
        .filter(([, count]) => count > 0)
        .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
        .slice(0, 6),
    [reactionCounts],
  );
  const totalReactions = useMemo(
    () =>
      Object.values(reactionCounts).reduce((total, count) => total + count, 0),
    [reactionCounts],
  );

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

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const supabaseClient = supabase;
    let isSubscribed = true;

    async function loadReactionCounts() {
      const { data, error } = await supabaseClient
        .from('reaction_counts')
        .select('emoji, count');

      if (error) {
        console.error('Unable to load reaction counts', error);
        return;
      }

      if (!isSubscribed) {
        return;
      }

      setReactionCounts(
        Object.fromEntries(data.map(({ emoji, count }) => [emoji, count])),
      );
    }

    loadReactionCounts().catch((error: unknown) => {
      console.error('Unable to load reaction counts', error);
    });

    function shouldSkipLaunchForLocalReaction(emoji: string) {
      const pendingCount = pendingLocalReactions.current[emoji] ?? 0;

      if (pendingCount === 0) {
        return false;
      }

      pendingLocalReactions.current = {
        ...pendingLocalReactions.current,
        [emoji]: pendingCount - 1,
      };
      return true;
    }

    function handleReactionCountChange({ count, emoji }: ReactionCountRow) {
      if (!shouldSkipLaunchForLocalReaction(emoji)) {
        launchEmoji(emoji);
      }

      setReactionCounts((currentCounts) => ({
        ...currentCounts,
        [emoji]: count,
      }));
    }

    const channel = supabaseClient
      .channel('reaction-counts')
      .on<ReactionCountRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reaction_counts' },
        (payload) => {
          handleReactionCountChange(payload.new);
        },
      )
      .on<ReactionCountRow>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reaction_counts' },
        (payload) => {
          handleReactionCountChange(payload.new);
        },
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabaseClient.removeChannel(channel).catch((error: unknown) => {
        console.error('Unable to remove reaction count channel', error);
      });
    };
  }, []);

  async function countReaction(emoji: string) {
    if (!supabase) {
      setReactionCounts((currentCounts) => ({
        ...currentCounts,
        [emoji]: (currentCounts[emoji] ?? 0) + 1,
      }));
      return;
    }

    const { data, error } = await supabase.rpc('increment_reaction_count', {
      reaction_emoji: emoji,
    });

    if (error) {
      console.error('Unable to count reaction', error);
      const pendingCount = pendingLocalReactions.current[emoji] ?? 0;

      if (pendingCount > 0) {
        pendingLocalReactions.current = {
          ...pendingLocalReactions.current,
          [emoji]: pendingCount - 1,
        };
      }

      return;
    }

    if (typeof data === 'number') {
      setReactionCounts((currentCounts) => ({
        ...currentCounts,
        [emoji]: data,
      }));
    }
  }

  function handleReaction(emoji: string) {
    if (supabase) {
      pendingLocalReactions.current = {
        ...pendingLocalReactions.current,
        [emoji]: (pendingLocalReactions.current[emoji] ?? 0) + 1,
      };
    }

    launchEmoji(emoji);
    countReaction(emoji).catch((error: unknown) => {
      console.error('Unable to count reaction', error);
    });
  }

  async function resetReactions() {
    if (!supabase) {
      setReactionCounts({});
      return;
    }

    const { error } = await supabase.rpc('reset_reaction_counts');

    if (error) {
      console.error('Unable to reset reactions', error);
      return;
    }

    setReactionCounts({});
  }

  function handleResetReactions() {
    resetReactions().catch((error: unknown) => {
      console.error('Unable to reset reactions', error);
    });
  }

  function handleReactionClick(emojiData: EmojiClickData) {
    handleReaction(emojiData.emoji);
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
    handleReaction(emojiData.emoji);
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
        <div className="reaction-meter" aria-live="polite">
          <div className="reaction-meter-header">
            <span>Live reactions</span>
            <div className="reaction-meter-actions">
              <button
                className="reaction-reset-button"
                onClick={handleResetReactions}
                type="button"
              >
                Reset
              </button>
              <strong>{totalReactions}</strong>
            </div>
          </div>

          <div className="reaction-meter-list">
            {topReactions.length > 0 ? (
              topReactions.map(([emoji, count]) => {
                const width =
                  totalReactions > 0
                    ? Math.max((count / totalReactions) * 100, 8)
                    : 8;

                return (
                  <div className="reaction-meter-row" key={emoji}>
                    <span className="reaction-meter-emoji">{emoji}</span>
                    <span className="reaction-meter-track">
                      <span
                        className="reaction-meter-fill"
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <strong>{count}</strong>
                  </div>
                );
              })
            ) : (
              <p className="reaction-meter-empty">
                {hasSupabaseConfig
                  ? 'Waiting for the first reaction'
                  : 'Local counts until Supabase is configured'}
              </p>
            )}
          </div>
        </div>

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
