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

function isOrganizationUser(o: any): o is OrganizationUser {
  return o != null && typeof o === 'object' && 'isValid' in o && '_organization' in o && '_user' in o;
}

export class OrganizationUser {
  private _organization: string = null;
  private _user: string = null;
  private _username: string = null;
  private _roles: Roles = new Roles();
  private _state: number = 0;

  constructor(o?: any) {
    if (o != null && typeof o === 'object') {
      this._import(o)
    }
  }

  public isValid(): boolean {
    return this._organization != null && this._user != null && this._roles != null;
  }

  public isEqual(o: OrganizationUser, full = false): boolean {
    if ((o == null) || !o.isValid() || !this.isValid()) {
      return false;
    }

    // Test Equality (NOTE: User Name is never used)
    let e: boolean = o._organization === this._organization && o._user === this._user;
    if (e && full) { // Add Roles and State to Test
      e = e && o._roles.isEqual(this._roles);
      e = e && o._state === this._state;
    }
    return e;
  }

  public isAdmin(): boolean {
    return this.isValid() && ObjectState.hasState(this._state, ObjectState.STATE_SYSTEM);
  }

  public reset(): OrganizationUser {
    this._organization = null;
    this._user = null;
    this._roles = null;
    this._state = 0;
    return this;
  }

  public clone(): OrganizationUser {
    const o: OrganizationUser = new OrganizationUser();
    o._organization = this._organization;
    o._user = this._user;
    o._roles = this._roles.clone();
    o._state = this._state;
    return o;
  }

  public organization(): string {
    return this._organization;
  }

  public user(): string {
    return this._user;
  }

  public username(): string {
    return this._username;
  }

  public roles(): Roles {
    return this._roles;
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
    this._user = this._extractString(o, 'user', null);
    this._username = this._extractString(o, 'username', null);
    this._state = this._extractNumber(o, 'state', 0);

    const csv: string = this._extractString(o, 'roles', null);
    this._roles.reset().import(csv);
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
