/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// SVELTE //
import { writable } from 'svelte/store';

// Developer Libraries //
import type { User } from "../classes/user";

const session_user_store = writable(null);

const custom_store = {
  subscribe: session_user_store.subscribe,
  // Reset
  reset: () => {
    session_user_store.set(null);
  },
  // Change User
  setUser: (u: User) => {
    // Are we Logging Off
    if ((u == null) || !u.isValid()) { // YES
      custom_store.reset()
    } else {
      session_user_store.set(u);
    }
  },
};

export default custom_store;
