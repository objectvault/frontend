/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// cSpell:ignore ferreira, immed, paulo, sourcenotes

// Libraries //
import _ from "lodash";

// Import Action Definition
import type { TAction } from './actions';

// Type Definition for List Header
export type TSLHeader = {
  title?: string;
}

// Type Definition for List Filter
export type TSLFilter = {
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
export type TSLListActions = (l: TModelStateList) => TAction[];
export type TSLEntryIcon = (entry?: any) => string;

// Type Definition for Single Field List
export type TModelStateList = {
  header: TSLHeader;
  listActions?: TSLListActions;
  filter?: TSLFilter;
  entries: () => any[];
  entryID: (e: any) => string;
  entryLabel: (e: any) => string;
  displayState?: boolean;
  entryState: (e: any) => any;
  entryIcon: (e: any) => string;
  stateIcon: (s: any) => string;
  changeNextState: (e: any) => Promise<any>;
  changePrevState?: (e: any) => Promise<any>;
  loader: () => Promise<any>;
  reloader?: (immed: boolean) => Promise<any>;  // Function used to force Reload
  // OPTIONAL: Extra Properties
  [key: string]: any;
};

function getListHeaderTitle(l: TModelStateList, d?: string): string {
  const t: string = _.get(l, "header.title", null);
  return t !== null ? t : d;
}

function normalizeFilterValue(l: TModelStateList, v: string): string {
  const f: any = _.get(l, "filter.normalize", null);
  return _.isFunction(f) ? f(v) : v.trim().toLowerCase();
}

function getListFilterDisplay(l: TModelStateList): boolean {
  const b: boolean = _.get(l, "filter.display", null);
  return b !== null ? !!b : false;
}

function getListFilterTitle(l: TModelStateList, d?: string): string {
  const t: string = _.get(l, "filter.title", null);
  return t !== null ? t : d;
}

function getListFilterPlaceHolder(l: TModelStateList, d?: string): string {
  const p: string = _.get(l, "filter.placeholder", null);
  return p !== null ? p : d;
}

function getListActions(l: TModelStateList): TAction[] {
  const f: TSLListActions = _.get(l, "listActions");
  if (_.isFunction(f)) {
    let a: TAction[] = f(l);
    return a != null ? a : [];
  }

  return [];
}

function nullOnEmptyTrimmedString(s: string): string {
  s = _.isString(s) && s.length ? s.trim() : null;
  return s !== null && s.length ? s : null;
}

function getStandardFilterObject(field: string, title?: string, placeholder?: string): TSLFilter {
  let fv: string = "";

  const f: TSLFilter = {
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

function callListReloader(l: TModelStateList, immed = false) {
  // Do we have a Reloader for the Object List?
  const f: any = l != null ? _.get(l, "reloader", null) : null;
  if (_.isFunction(f)) {
    // YES: Call it
    f(immed);
  }
}

export default {
  title: getListHeaderTitle,
  callReloader: callListReloader,
  displayFilter: getListFilterDisplay,
  filterTitle: getListFilterTitle,
  filterNormalize: normalizeFilterValue,
  filterPlaceHolder: getListFilterPlaceHolder,
  listActions: getListActions,
  standardFilterObject: getStandardFilterObject
}
