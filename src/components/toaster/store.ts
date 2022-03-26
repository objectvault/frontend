import { writable } from 'svelte/store';

export type CBNotifyHandler = (n: TNotify) => void;

// Definition for an Action
export type TNotify = {
  id?: number;
  icon?: string;
  header?: string | any;
  autohide?: boolean;
  period?: number;
  body: string | any;
  onOpen?: CBNotifyHandler;
  onClose?: CBNotifyHandler;
  [key: string]: any;
}

export type TNotifyStore = {
  subscribe: any;
  push: any;
  pop: any;
  reset: any;
}

// Current ID
let idx: number = 0;

function hasProperty(o: TNotify, name: string): boolean {
  return o.hasOwnProperty(name);
}

function hasFunctionProperty(o: TNotify, name: string): boolean {
  return hasProperty(o, name) ? typeof o.name === "function" : false;
}

function setIfNotSet(o: TNotify, name: string, v: any) {
  if (!hasProperty(o, name)) {
    o[name] = v;
  }
}

function dereference(o: TNotify, name: string, d?: any): any {
  if (hasProperty(o, name)) {
    let v: any = o[name];
    if (typeof v === "function") {
      v = v(o);
    }

    return v != null ? v : d;
  }

  return d;
}

function dereferenceString(o: TNotify, name: string, d?: string): string {
  // Derefence propertye
  let v: any = dereference(o, name, d);

  // Is value a string?
  if ((v == null) || (typeof v !== "string")) { // NO: Return Default
    return d;
  }

  return <string>v;
}

function normalize(n: TNotify): TNotify {
  // Associate ID
  n.idx = idx++;

  const delay: number = hasProperty(n, 'period') ? 5 : n.period;

  // Do we have a header?
  n.header = dereferenceString(n, "header", null);
  if (n.header === null) { // NO: Make sure autohide is on
    n.autohide = true;
    setIfNotSet(n, '__ticks', delay);
    n.__ticks = 6;
  } else // YES: Do we have a maximum display period?
  if (hasProperty(n, 'period')) { // YES: Enable Auto Hide if user doesn't close it
    n.autohide = true;
    setIfNotSet(n, '__ticks', delay);
  } else { // ELSE: Set Default Value for "period"
    n.period = 0;
  }

  // Normalize Body
  n.body = dereferenceString(n, "body", "");

  // Is "autohide" set?
  if (!hasProperty(n, "autohide")) { // NO: Use Default [false]
    n.autohide = false;
  }

  // HANDLERS
  if (!hasFunctionProperty(n, "onOpen")) { // NO: Use Default [null]
    n.onOpen = null;
  }

  if (!hasFunctionProperty(n, "onClose")) { // NO: Use Default [null]
    n.onClose = null;
  }

  return n;
}

function createStore(): TNotifyStore {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    push: (n: TNotify) => update(
      (list: TNotify[]) => {
        list.push(normalize(n));
        return list;
      }),
    pop: (n: TNotify) => update(
      (list: TNotify[]) => {
        const l: TNotify[] = list.filter((e: TNotify) => e.idx != n.idx)
        return l;
      }),
    reset: () => set([])
  };
}

// Single Instance
const store: TNotifyStore = createStore();
export default store;