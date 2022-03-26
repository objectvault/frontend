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

function isOrganization(o: any): o is Organization {
  return o != null && typeof o === 'object' && 'isValid' in o && '_id' in o && '_alias' in o;
}

export class Organization {
  private _id: string = null;
  private _name: string = null;
  private _alias: string = null;
  private _state: number = 0;

  constructor(o?: any) {
    if (o != null && typeof o === 'object') {
      this._import(o)
    }
  }

  public isValid(): boolean {
    return this._id != null && this._alias != null;
  }

  public isEqual(o: Organization, full = false): boolean {
    if ((o == null) || !o.isValid() || !this.isValid()) {
      return false;
    }

    // Test Equality (NOTE: Name is never used)
    let e: boolean = o._id === this._id && o._alias === this._alias;
    if (e && full) { // Add State to Test
      e = e && o._state === this._state;
    }
    return e;
  }

  public isSystem(): boolean {
    return this.isValid() && ObjectState.hasState(this._state, ObjectState.STATE_SYSTEM);
  }

  public reset(): Organization {
    this._id = null;
    this._name = null;
    this._alias = null;
    this._state = 0;
    return this;
  }

  public clone(): Organization {
    const o: Organization = new Organization();
    o._id = this._id;
    o._name = this._name;
    o._alias = this._alias;
    o._state = this._state;
    return o;
  }

  public id(): string {
    return this._id;
  }

  public name(): string {
    return this._name;
  }

  public alias(): string {
    return this._alias;
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

    // Import Organization
    this._import(registry);

    // Is Organization Valid?
    return this.isValid();
  }

  private _import(o: any) {
    // Import, if possible, organization value
    this._id = this._extractString(o, 'id', null);
    this._name = this._extractString(o, 'name', null);
    this._alias = this._extractString(o, 'alias', null);
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

