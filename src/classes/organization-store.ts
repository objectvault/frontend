/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Import Common State Management Function
import ObjectState from "../api/states";
import { Roles } from './roles';

function isOrganizationStore(o: any): o is OrganizationStore {
  return o != null && typeof o === 'object' && 'isValid' in o && '_organization' in o && '_store' in o;
}

export class OrganizationStore {
  private _organization: string = null;
  private _store: string = null;
  private _storename: string = null;
  private _state: number = 0;

  constructor(o?: any) {
    if (o != null && typeof o === 'object') {
      this._import(o)
    }
  }

  public isValid(): boolean {
    return this._organization != null && this._store != null && this._storename != null;
  }

  public isEqual(o: OrganizationStore, full = false): boolean {
    if ((o == null) || !o.isValid() || !this.isValid()) {
      return false;
    }

    // Test Equality (NOTE: User Name is never used)
    let e: boolean = o._organization === this._organization && o._store === this._store;
    if (e && full) { // Add Roles and State to Test
      e = e && o._storename == o._storename;
    }
    return e;
  }

  public reset(): OrganizationStore {
    this._organization = null;
    this._store = null;
    this._storename = null;
    this._state = 0;
    return this;
  }

  public clone(): OrganizationStore {
    const o: OrganizationStore = new OrganizationStore();
    o._organization = this._organization;
    o._store = this._store;
    o._storename = this._storename;
    o._state = this._state;
    return o;
  }

  public organization(): string {
    return this._organization;
  }

  public store(): string {
    return this._store;
  }

  public storename(): string {
    return this._storename;
  }

  public state(): number {
    return this._state;
  }

  public import(registry: any): boolean {
    if (registry == null || typeof registry !== 'object') {
      return false;
    }

    // Clear Existing Value
    this.reset();

    // Import Organization-User Registry
    this._import(registry);

    // Is Organization Valid?
    return this.isValid();
  }

  private _import(o: any) {
    // Import, if possible, value
    this._organization = this._extractString(o, 'object', null);
    this._store = this._extractString(o, 'store', null);
    this._storename = this._extractString(o, 'alias', null);
    this._state = this._extractNumber(o, 'state', 0);
  }

  private _extract(o: any, pname: string, d: any): any {
    return o.hasOwnProperty(pname) ? o[pname] : d;
  }

  private _extractString(o: any, pname: string, d: string) {
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

  private _extractNumber(o: any, pname: string, d: number) {
    let n: number = this._extract(o, pname, d);
    return typeof n === 'number' ? n : d;
  }
}
