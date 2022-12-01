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

function isUser(u: any): u is User {
  return u != null && typeof u === 'object' && '_id' in u && '_username' in u && '_email' in u;
}

export class User {
  private _id: string = null;
  private _name: string = null;
  private _username: string = null;
  private _email: string = null;
  private _state: number = 0;

  constructor(u?: any) {
    if (u != null && typeof u === 'object') {
      this._import(u)
    }
  }

  public isValid(): boolean {
    return this._id != null && this._username != null && this._email != null;
  }

  public isSelf(id: string): boolean {
    return id === this._id
  }

  public isEqual(u: User, full = false): boolean {
    if ((u == null) || !u.isValid() || !this.isValid()) {
      return false;
    }

    // Test Equality (NOTE: Name is never used)
    let e: boolean = u._id === this._id && u._username === this._username && u._email === this._email;
    if (e && full) { // Add State to Test
      e = e && u._state === this._state;
    }
    return e;
  }

  public isSystemAdmin(): boolean {
    return this.isValid() && ObjectState.hasState(this._state, ObjectState.STATE_SYSTEM);
  }

  public reset(): User {
    this._id = null;
    this._name = null;
    this._username = null;
    this._email = null;
    this._state = 0;
    return this;
  }

  public clone(): User {
    const u: User = new User();
    u._id = this._id;
    u._name = this._name;
    u._username = this._username;
    u._email = this._email;
    u._state = this._state;
    return u;
  }

  public id(): string {
    return this._id;
  }

  public name(): string {
    return this._name;
  }

  public alias(): string {
    return this._username;
  }

  public email(): string {
    return this._email;
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

    // Import User from Registry
    this._import(registry);

    // Is User Valid?
    return this.isValid();
  }

  private _import(u: any) {
    // Import, if possible, user value
    this._id = this._extractString(u, 'id', null);
    this._name = this._extractString(u, 'name', null);
    this._username = this._extractString(u, 'alias', null);
    this._email = this._extractString(u, 'email', null);
    this._state = this._extractNumber(u, 'state', 0);
  }

  private _extract(u: any, pname: string, d: any): any {
    return u.hasOwnProperty(pname) ? u[pname] : d;
  }

  private _extractString(u: any, pname: string, d: string) {
    let s: string = this._extract(u, pname, d);
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

  private _extractNumber(u: any, pname: string, d: number) {
    let n: number = this._extract(u, pname, d);
    return typeof n === 'number' ? n : d;
  }
}

