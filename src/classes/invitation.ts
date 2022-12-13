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

function isInvitation(o: any): o is Invitation {
  return o != null && typeof o === 'object' && 'isValid' in o && '_id' in o && '_uid' in o && '_invitee' in o;
}

export class Invitation {
  private _id: string = null;
  private _uid: string = null;
  private _invitee: string = null;
  private _creator: string = null;
  private _expiration: Date = null;
  private _state: number = 0;

  constructor(o?: any) {
    if (o != null && typeof o === 'object') {
      this._import(o)
    }
  }

  public isValid(): boolean {
    return this._id != null && this._uid != null && this._invitee != null;
  }

  public isEqual(o: Invitation, full = false): boolean {
    if ((o == null) || !o.isValid() || !this.isValid()) {
      return false;
    }

    // Test Equality (NOTE: Name is never used)
    let e: boolean = o._id === this._id && o._uid === this._uid;
    if (e && full) { // Full
      e = e && o._invitee === this._invitee && o._state === this._state;
    }
    return e;
  }

  public isSystem(): boolean {
    return this.isValid() && ObjectState.hasState(this._state, ObjectState.STATE_SYSTEM);
  }

  public reset(): Invitation {
    this._id = null;
    this._uid = null;
    this._invitee = null;
    this._creator = null;
    this._expiration = null;
    this._state = 0;
    return this;
  }

  public clone(): Invitation {
    const o: Invitation = new Invitation();
    o._id = this._id;
    o._uid = this._uid;
    o._invitee = this._invitee;
    o._creator = this._creator;
    o._expiration = this._expiration;
    o._state = this._state;
    return o;
  }

  public id(): string {
    return this._id;
  }

  public uid(): string {
    return this._uid;
  }

  public invitee(): string {
    return this._invitee;
  }

  public creator(): string {
    return this._creator;
  }

  public expiration(): Date {
    return this._expiration;
  }

  public state(): number {
    return this._state;
  }

  public import(i: any): boolean {
    if (i == null || typeof i !== 'object') {
      return false;
    }

    // Clear Existing Value
    this.reset();

    // Import Invitation
    this._import(i);

    // Is Invitation Valid?
    return this.isValid();
  }

  private _import(o: any) {
    // Import, if possible, invitation value
    this._id = this._extractString(o, 'id', null);
    this._uid = this._extractString(o, 'uid', null);
    this._invitee = this._extractString(o, 'invitee', null);
    this._creator = this._extractString(o, 'creator', null);
    this._state = this._extractNumber(o, 'state', 0);

    // Parse Invitation Expiration TimeStamp
    const e: string | null = this._extractString(o, 'expiration', null)
    if (e !== null) {
      const ne: number = Date.parse(e);
      if (!isNaN(ne)) {
        this._expiration = new Date(ne);
      }
    }
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
