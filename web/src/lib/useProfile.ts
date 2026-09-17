import { useEffect, useSyncExternalStore } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'
import { fetchProfile, saveProfile } from './db'
import { displayNameOf } from './displayName'

/**
 * The signed-in user's profile row, shared by the header and the account
 * sheet so a saved name shows everywhere at once. Loaded once per user.
 */

interface ProfileState {
  userId: string | null
  profile: Profile | null
  ready: boolean
}

const EMPTY: ProfileState = { userId: null, profile: null, ready: false }
let state = EMPTY
const listeners = new Set<() => void>()

function set(next: ProfileState) {
  state = next
  for (const l of listeners) l()
}

function load(user: User) {
  if (state.userId === user.id) return
  set({ userId: user.id, profile: null, ready: false })
  fetchProfile(user.id)
    .then((profile) => state.userId === user.id && set({ userId: user.id, profile, ready: true }))
    .catch(() => state.userId === user.id && set({ ...state, ready: true }))
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export interface ProfileView {
  profile: Profile | null
  /** Saved display name, else the name from the auth provider or email. */
  displayName: string
  ready: boolean
}

export function useProfile(user: User | null): ProfileView {
  useEffect(() => {
    if (user) load(user)
    else if (state.userId) set(EMPTY)
  }, [user])

  const s = useSyncExternalStore(subscribe, () => state, () => EMPTY)
  const mine = user !== null && s.userId === user.id
  const profile = mine ? s.profile : null
  return {
    profile,
    displayName: profile?.displayName || displayNameOf(user),
    ready: mine && s.ready,
  }
}

export async function updateDisplayName(user: User, name: string): Promise<void> {
  const profile = await saveProfile(user.id, name)
  if (state.userId === user.id) set({ userId: user.id, profile, ready: true })
}
