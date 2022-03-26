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

import type { TAction } from '../objects/actions';

// Wrapper around current Notification Handler
const actions_store: any = writable([]);

// API for Notification Store
const custom_store: any = {
  subscribe: actions_store.subscribe,
  set: actions_store.set,
  // Reset
  reset: () => {
    actions_store.set([]);
  },
  // Add an Action
  append: (a: TAction) => {
    actions_store.update((actions: any[]) => {
      if (actions.length === 0) {
        return [a];
      }

      actions.push(a);
      return actions;
    });
  },
  // Remove an Action
  remove(id: string) {
    actions_store.update((actions: any[]) => {
      if (actions.length > 0) {
        const i = actions.findIndex((a: TAction) => a.id == id)
        if (i == 0) {
          actions.shift()
        } else if (i == (actions.length - 1)) {
          actions.pop()
        } else {
          actions.splice(i, 1);
        }
      }
      return actions;
    });
  }
};

export default custom_store;
