import type { Tables } from './database.types';
import { supabase } from './supabaseClient';

export type ReactionCountRow = Tables<'reaction_counts'>;

export async function loadData() {
  if (!supabase) {
    console.warn('Supabase client is not configured. Unable to load data.');
    return { data: [] };
  }

  return await supabase.from('reaction_counts').select('emoji, count');
}

export function listenToChanges(
  callback: (payload: { new: ReactionCountRow }) => void,
) {
  if (!supabase) {
    console.warn(
      'Supabase client is not configured. Unable to listen to changes.',
    );
    return () => {};
  }

  const channel = supabase
    .channel('reaction-counts')
    .on<ReactionCountRow>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reaction_counts' },
      (payload) => {
        callback(payload);
      },
    )
    .on<ReactionCountRow>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'reaction_counts' },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();

  function cleanup() {
    if (!supabase) {
      return;
    }
    supabase.removeChannel(channel).catch((error: unknown) => {
      console.error('Unable to remove reaction count channel', error);
    });
  }

  return cleanup;
}

export async function resetReactions() {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc('reset_reaction_counts');

  if (error) {
    console.error('Unable to reset reactions', error);
    return;
  }
}
