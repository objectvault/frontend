/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// cSpell:ignore TSFL

// Libraries //
import _ from "lodash";

// Import Action Definition
import type { TAction } from './actions';

// Type Definition for List Header
export type TSFLHeader = {
  title?: string;
}

// Type Definition for Display Field
export type TSFLEntry = {
  id: (entry: any) => string;
  value: (entry: any) => string;
  icon: (entry: any) => string;
  href: (entry: any) => string | null;
  // OPTIONAL: Extra Properties
  [key: string]: any;
}

// Type Definition for List Filter
export type TSFLFilter = {
  display?: boolean;
  title?: string;
  placeholder?: string;
  has: () => boolean;
  get: () => string;
  set: (value: string) => string;
  clear: () => string;
  // OPTIONAL: Extra Properties
  [key: string]: any;
};

// Function Type Definition for List Loader
export type TSFLLoader = () => Promise<any>;
export type TSFLReloader = (immed: boolean) => Promise<any>;
export type TSFLListActions = (l: TSingleFieldList) => TAction[];
export type TSFLEntryActions = (entry?: any) => TAction[];

// Type Definition for Single Field List
export type TSingleFieldList = {
  header?: TSFLHeader;
  listActions?: TSFLListActions;
  filter?: TSFLFilter;
  entry: TSFLEntry;
  entryIcon?: string;
  entryActions?: TSFLEntryActions;
  loader: TSFLLoader;
  reloader?: TSFLReloader;  // Function used to force Reload
  // OPTIONAL: Extra Properties
  [key: string]: any;
};

function getListHeaderTitle(l: TSingleFieldList, d?: string): string {
  const t: string = _.get(l, "header.title", null);
  return t !== null ? t : d;
}

function normalizeFilterValue(l: TSingleFieldList, v: string): string {
  const f: any = _.get(l, "filter.normalize", null);
  return _.isFunction(f) ? f(v) : v.trim().toLowerCase();
}

function getListFilterDisplay(l: TSingleFieldList): boolean {
  const b: boolean = _.get(l, "filter.display", null);
  return b !== null ? !!b : false;
}

function getListFilterTitle(l: TSingleFieldList, d?: string): string {
  const t: string = _.get(l, "filter.title", null);
  return t !== null ? t : d;
}

function getListFilterPlaceHolder(l: TSingleFieldList, d?: string): string {
  const p: string = _.get(l, "filter.placeholder", null);
  return p !== null ? p : d;
}

function getListActions(l: TSingleFieldList): TAction[] {
  const f: TSFLListActions = _.get(l, "listActions");
  if (_.isFunction(f)) {
    let a: TAction[] = f(l);
    return a != null ? a : [];
  }

  return [];
}

function getEntryActions(l: TSingleFieldList, entry: any): TAction[] {
  const f: TSFLEntryActions = _.get(l, "entryActions");
  if (_.isFunction(f)) {
    let a: TAction[] = f(entry);
    return a != null ? a : [];
  }

  return [];
}

function nullOnEmptyTrimmedString(s: string): string {
  s = _.isString(s) && s.length ? s.trim() : null;
  return s !== null && s.length ? s : null;
}

function
function getStandardEntryObject(id: string, display: string, icon?: string, href?: any): TSFLEntry {
  const e: TSFLEntry = {
    _id: nullOnEmptyTrimmedString(id),
    _display: nullOnEmptyTrimmedString(display),
    _icon: nullOnEmptyTrimmedString(icon),
    id: null,
    value: null,
    icon: null,
    href: null
  }

  e.id = (entry: any): string => {
    return entry != null && e._id !== null ? _.get(entry, e._id) : "";
  };

  e.value = (entry: any): string => {
    let v: any = entry != null && e._display !== null ? _.get(entry, e._display) : null;
    // Is Value a Function?
    if ((v != null) && (typeof v === 'function')) { // YES: Call the Function in the Context of the Entry
      // NOTE: Call in context required, since entry might be a class (this required)
      v = v.call(entry);
    }

    return v != null && _.isString(v) ? v : "";
  };

  e.icon = (entry: any): string => {
    return entry != null && e._icon !== null ? e._icon : null;
  };

  if (href != null) {
    if (_.isString(href)) {
      e.href = () => href;
    } else if (_.isFunction(href)) {
      e.href = href;
    }
  }
  return e;
}

function getStandardFilterObject(field: string, title?: string, placeholder?: string): TSFLFilter {
  let fv: string = "";

  const f: TSFLFilter = {
    _field: nullOnEmptyTrimmedString(field),
    display: true,
    title: nullOnEmptyTrimmedString(title),
    placeholder: nullOnEmptyTrimmedString(placeholder),
    has: () => fv.length > 0,
    get: () => fv,
    set: (v: string) => {
      const o: string = fv;

      // Is Incoming Value Empty?
      fv = nullOnEmptyTrimmedString(v);
      if (fv === null) { // YES: Use Empty String as Filter Value
        fv = ""
      }
      return o;
    },
    clear: () => {
      const o: string = fv;
      fv = "";
      return o
    }
  }

  return f;
}

function callListReloader(l: TSingleFieldList, immed = false) {
  // Do we have a Reloader for the Object List?
  const f: TSFLReloader = l != null ? _.get(l, "reloader", null) : null;
  if (_.isFunction(f)) {
    // YES: Call it
    f(immed);
  }
}

export default {
  title: getListHeaderTitle,
  callReloader: callListReloader,
  displayFilter: getListFilterDisplay,
  entryActions: getEntryActions,
  filterTitle: getListFilterTitle,
  filterNormalize: normalizeFilterValue,
  filterPlaceHolder: getListFilterPlaceHolder,
  listActions: getListActions,
  standardEntryObject: getStandardEntryObject,
  standardFilterObject: getStandardFilterObject
}
