/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { writable } from 'svelte/store';

// Defini Notification Handler
export type TNotificationHandler = (notice: any) => void;

// NULL Handler - Drop Message
const nullHandler: any = () => null;

// Wrapper around current Notification Handler
const notify_store: any = writable(nullHandler);

// API for Notification Store
const custom_store: any = {
  subscribe: notify_store.subscribe,
  // Reset
  reset: () => {
    notify_store.set(nullHandler);
  },
  // Set Notification Handler
  handler: (handler: TNotificationHandler) => {
    // Are we Logging Off
    if (handler == null) { // YES
      notify_store.reset()
    } else {
      notify_store.set(handler);
    }
  },
};

export default custom_store;
