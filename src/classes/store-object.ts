/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Libraries //
import _ from "lodash";

function isStoreObject(o: any): o is StoreObject {
  return o != null && typeof o === 'object' && 'isValid' in o && '_store' in o && '_user' in o;
}

export class StoreObject {
  protected _store: string = null;
  protected _parent: number = null;
  protected _type: number = null;
  protected _id: number = null;
  protected _title: string = null;
  protected _values: any;
  protected _modified: boolean = false;

  constructor(o?: any) {
    if (o != null && typeof o === 'object') {
      this._import(o)
    }
  }

  public isValid(): boolean {
    return this._store != null && this._parent != null && this._type != null && this._id != null;
  }

  public isEqual(o: StoreObject, full = false): boolean {
    if ((o == null) || !o.isValid() || !this.isValid()) {
      return false;
    }

    // Test Equality
    let e: boolean = o._store === this._store && o._parent === this._parent && o._id === this._id;
    if (e && full) { // Add Type and Title
      e = e && o._type === this._type;
      e = e && o._title === this._title;
    }
    return e;
  }

  public isHydrated(): boolean {
    return this._values !== undefined;
  }

  public clone(): StoreObject {
    const o: StoreObject = new StoreObject();
    o._store = this._store;
    o._parent = this._parent;
    o._type = this._type;
    o._id = this._id;
    o._title = this._title;
    return o;
  }

  public store(): string {
    return this._store;
  }

  public parent(hex = false): number | string {
    if (hex) {
      return `:${this._parent != null ? this._parent.toString(16) : 0}`;
    }
  }

  public type(): number {
    return this._type;
  }

  public id(hex = false): number | string {
    if (hex) {
      return `:${this._id != null ? this._id.toString(16) : 0}`;
    }
    return this._id;
  }

  public title(): string {
    return this._title;
  }

  public property(path: string, d?: any): any {
    return this._values === undefined ? d : _.get(this._values, path, d);
  }

  public values(): any {
    return this._values;
  }

  public setTitle(t: string) {
    if (this._title !== t) {
      this._title = t;
      this._modified = true;
    }
  }

  public setProperty(path: string, v: any) {
    if (this._values === undefined) {
      this._values = {};
    }

    _.set(this._values, path, v);
    this._modified = true;
  }

  public unsetProperty(path: string) {
    _.unset(this._values, path);
    this._modified = true;
  }

  public import(registry: any): boolean {
    if (registry == null || typeof registry !== 'object') {
      return false;
    }

    // Clear Existing Value
    this._reset();

    // Import Organization-User Registry
    this._import(registry);

    // Is Organization Valid?
    return this.isValid();
  }

  public hydrate(v: any) {
    this._values = v;
  }

  protected _reset(): StoreObject {
    this._store = null;
    this._parent = null;
    this._type = null;
    this._id = null;
    this._title = null;
    this._values = undefined;
    return this;
  }


  protected _import(o: any) {
    // Import, if possible, value
    this._store = this._extractString(o, 'store', null);
    this._parent = this._extractNumber(o, 'parent', null);
    this._type = this._extractNumber(o, 'type', null);
    this._id = this._extractNumber(o, 'id', null);
    this._title = this._extractString(o, 'title', null);
    this._values = this._extract(o, "values");
  }

  protected _extract(o: any, pname: string, d?: any): any {
    return _.get(o, pname, d);
  }

  protected _extractString(o: any, pname: string, d: string) {
    let s: string = this._extract(o, pname, d);
    if (typeof s === 'string') {
      s = s.trim();
      if (s.length === 0) {
        s = d;
      }
    } else {
      s = d;
    }
    return s;
  }

  protected _extractNumber(o: any, pname: string, d: number) {
    let n: number = this._extract(o, pname, d);
    return typeof n === 'number' ? n : d;
  }
}
