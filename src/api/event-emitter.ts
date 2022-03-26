/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Definition of an Event Handler
export type TEventHandler = (event: string, ...args: any[]) => boolean

// Definition for an Event
export type TEvent = {
  id: string;
  params?: any[];
  [key: string]: any;
}

type TEventListener = {
  id: number;
  once: boolean;
  events: string[];
  handler: TEventHandler;
};

let _listeners: TEventListener[] = [];

function _listener(events: string | string[], handler: TEventHandler): TEventListener {
  const l: TEventListener = {
    id: Date.now(), // Simple Unique ID : Unix Time Stamp
    once: false,
    events: Array.isArray(events) ? events : [events],
    handler,
  };

  return l;
}

function _listensOnEvent(l: TEventListener, event: string): boolean {
  const i: number = l.events.findIndex((e: string) => e === event);
  return i >= 0;
}

function on(events: string | string[], handler: TEventHandler): number {
  if ((typeof events === 'string') || Array.isArray(events)) {
    if (typeof handler === 'function') {
      const l: TEventListener = _listener(events, handler);
      _listeners.push(l);
      return l.id;
    }
  }

  return null;
}

function once(events: string | string[], handler: TEventHandler): number {
  if ((typeof events === 'string') || Array.isArray(events)) {
    if (typeof handler === 'function') {
      const l: TEventListener = _listener(events, handler);
      l.once = true;
      _listeners.push(l);
      return l.id;
    }
  }

  return null;
}

function removeListener(id: number) {
  if (typeof id === 'number') {
    const i: number = _listeners.findIndex((l: TEventListener) => l.id == id);
    if (i >= 0) {
      _listeners.splice(i, 1);
    }
  }
}

function removeAllListeners(event?: string) {
  if ((typeof event === 'string') && (event.length > 0)) {
    _listeners = _listeners.filter((l: TEventListener) => _listensOnEvent(l, event));
  } else {
    _listeners = [];
  }
}

function emit(event: string, ...args: any[]): void {
  if (typeof event === 'string') {
    const removeOnce: number[] = [];

    // Loop Through Listners Looking for 'event' Handlers
    _listeners.forEach((l: TEventListener, i: number) => {
      if (_listensOnEvent(l, event)) {
        // Is Once Handler?
        if (l.once) { // YES: Add to List for Removal
          removeOnce.push(i);
        }

        l.handler.apply(null, args);
      }
    });

    if (removeOnce.length) {
      // Sort Descending Order
      removeOnce.sort((a: number, b: number) => {
        return a > b ? 1 : -1
      });

      // Remove Each Entry
      removeOnce.forEach((i: number) => _listeners.splice(i, 1));
    }
  }
}

// Create Event Emitter Object
const EventEmitter: any = {
  on,
  once,
  removeListener,
  removeAllListeners,
  emit
}

export default EventEmitter;
