/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// FUNCTIONS
const FUNCTION_READ: number = 0x0001;
const FUNCTION_LIST: number = 0x0002;
const FUNCTION_CREATE: number = 0x0100;
const FUNCTION_UPDATE: number = 0x0200;
const FUNCTION_DELETE: number = 0x0400;

// COMBINED READ and LIST
const FUNCTION_READ_LIST: number = 0x0003;

// OBJECT: CATEGORIES
const CATEGORY_SYSTEM: number = 0x0100;    // SYSTEM Management
const CATEGORY_ORG: number = 0x0200;       // Organization Management
const CATEGORY_STORE: number = 0x0300;     // Store Managemenr

// MANAGEMENT: SUB-CATEGORIES
const SUBCATEGORY_CONF: number = 0x0001;   // Configuration / Settings Management
const SUBCATEGORY_USER: number = 0x0002;   // User Management
const SUBCATEGORY_ROLES: number = 0x0003;  // User Roles Management
const SUBCATEGORY_INVITE: number = 0x0004; // User Invitation
const SUBCATEGORY_ORG: number = 0x0005;    // Store Management
const SUBCATEGORY_STORE: number = 0x0006;  // Store Management
const SUBCATEGORY_OBJECT: number = 0x0007; // Object Management

// BIT MASKS //

// FUNCTION GROUPS
const MASK_FUNCTION_KNOWN: number = 0x0701;
const MASK_FUNCTION_ANY: number = 0x0F0F;
const MASK_FUNCTION_READONLY: number = 0x000F;
const MASK_FUNCTION_MODIFY: number = 0x0F00;

// CATEGORY
const MASK_CATEGORY_ANY: number = 0x0F0F;     // Mask Valid Category and Sub-Category bis
const MASK_CATEGORY_ONLY: number = 0x0F00;    // Mask Category Only Bits
const MASK_SUBCATEGORY_ONLY: number = 0x000F; // Mask Sub-Category Only Bits

// VALID ROLE BITS
const MASK_CATEGORY: number = 0x0F0F0000; // Mask Valid Category Bits
const MASK_FUNCTIONS: number = 0x00000F0F; // Mask Valid Permssion Bits
const MASK_ROLE: number = 0x0F0F0F0F; // Mask Valid Role Bits

// BITS offsets
const OFFSET_CATEGORY: number = 16;

function isRole(r: any): r is Role {
  return r != null && typeof r === 'object' && '_category' in r && '_functions' in r;
}

function roleCategory(r: number): number {
  return (r & MASK_CATEGORY) >> OFFSET_CATEGORY;
}

function roleFunctions(r: number): number {
  return (r & MASK_FUNCTIONS);
}

export class Role {
  private _category: number = 0;
  private _functions: number = 0;

  constructor(role?: number) {
    if ((role != null) && (role > 0)) {
      this._import(role);
    }
  }

  public reset(): Role {
    this._category = 0;
    this._functions = 0;
    return this;
  }

  public clone(): Role {
    const r: Role = new Role();
    r._category = this._category;
    r._functions = this._functions;
    return r;
  }

  public isValid(): boolean {
    return this._category !== 0 && this._functions !== 0;
  }

  public isEqual(r: Role | number): boolean {
    if ((r == null) || !this.isValid()) {
      return false;
    }

    if (typeof r === 'number') {
      return (r > 0) && this._isEqualTo((r & MASK_CATEGORY) >> OFFSET_CATEGORY, r & MASK_FUNCTIONS);
    }

    if (isRole(r)) {
      return this._isEqualTo(r._category, r._functions);
    }

    return false;
  }

  public isCategory(c: number): boolean {
    return c != null && this.isValid() && c == this._category;
  }

  public category(): number {
    return this._category;
  }

  public functions(): number {
    return this._functions;
  }

  public has(f: number): boolean {
    return (this._functions & f) === f;
  }

  public set(r: number) {
    this._functions = roleFunctions(r);
  }

  public import(r: number): Role {
    if ((r != null) && (r > 0)) {
      this._import(r);
    }
    return this;
  }

  public export(): number {
    if (!this.isValid()) {
      return 0;
    }

    return (this._category << OFFSET_CATEGORY) | this._functions;
  }

  private _isEqualTo(c: number, fs: number) {
    return c === this._category && fs == this._functions;
  }

  private _import(r: number) {
    this._category = roleCategory(r);
    this._functions = roleFunctions(r);
  }
}

export class Roles {
  // Store Roles as Map
  private _roles: Map<number, Role> = new Map<number, Role>();

  constructor(csv?: string) {
    if (csv != null) {
      this.import(csv);
    }
  }

  public isEmpty(): boolean {
    return this._roles.size === 0;
  }

  public isEqual(to: Roles): boolean {
    if (to._roles.size === this._roles.size) {
      for (let key of this._roles.keys()) {
        if (!to._roles.has(key)) {
          return false;
        }

        if (this._roles.get(key) !== to._roles.get(key)) {
          return false;
        }
      }

      return true;
    }
    return false;
  }

  public reset(): Roles {
    this._roles = new Map<number, Role>();
    return this;
  }

  public clone(): Roles {
    const c: Roles = new Roles();

    // Clone Existing Roles
    this._roles.forEach((r: Role, k: number) => c._roles.set(k, r.clone()))
    return c;
  }

  public merge(m: Roles): boolean {
    let modified: boolean = false;

    // Update Existing Roles and Add New Roles
    m._roles.forEach((r: Role, k: number) => {
      let c: number = r.category();
      // Role Category Exists?
      if (this._roles.has(r.category())) { // YES : Matching Functions?
        if (!this._roles.get(k).isEqual(r)) { // NO: Update Role
          this._roles.set(k, r.clone());
          modified = true;
        }
      } else { // NO: Add Role
        this._roles.set(k, r.clone());
        modified = true;
      }
    });

    return modified;
  }

  public import(csv: string): Roles {
    // Is Non Empty String?
    csv = csv.trim();
    if (csv.length == 0) { // NO: Ignore Changes
      return this;
    }

    // Convert CSV to Roles
    this._roles = this._import(csv);
  }

  public export(): string {
    if (this._roles.size) {
      const roles: number[] = []
      for (let r of this._roles.values()) {
        if (r.functions() !== 0) {
          roles.push(r.export());
        }
      }

      return roles
        .sort()
        .join(',');
    }

    return "";
  }

  public has(c: number): boolean {
    return this._roles.has(c);
  }

  public hasRole(c: number, f: number): boolean {
    const r: Role = this._roles.get(c);
    if (r == null) {
      return false;
    }
    return r.has(f);
  }

  public get(c: number): Role {
    return this._roles.has(c) ? this._roles.get(c) : null;
  }

  public set(r: number) {
    const c: number = roleCategory(r);
    const role: Role = this.get(c);
    if (role != null) {
      role.set(r);
    } else {
      this.add(new Role(r));
    }
  }

  public add(r: Role): Roles {
    this._roles.set(r.category(), r.clone());
    return this;
  }

  public del(c: number): Roles {
    this._roles.delete(c);
    return this;
  }

  private _import(csv: string): Map<number, Role> {
    const roles: Role[] = csv
      .split(",") // Explode String
      .map((v: string): number => {
        // Map to Integer
        const t: string = v.trim();
        return t.length ? parseInt(t) : null;
      })
      .filter((v: number): boolean => v != null && !isNaN(v)) // Filter out Invalid Values
      .filter((v: number): boolean => v > 0) // Filter Out Invalid Numbers
      .map((v: number) => new Role(v))
      .sort();

    const map: Map<number, Role> = new Map<number, Role>();
    for (let role of roles) {
      map.set(role.category(), role);
    }

    return map;
  }
}

export const constants: any = {
  // CATEGORIES
  CATEGORY_SYSTEM,
  CATEGORY_ORG,
  CATEGORY_STORE,
  // SUB-CATEGORIES
  SUBCATEGORY_CONF,
  SUBCATEGORY_USER,
  SUBCATEGORY_ROLES,
  SUBCATEGORY_INVITE,
  SUBCATEGORY_ORG,
  SUBCATEGORY_STORE,
  SUBCATEGORY_OBJECT,
  // FUNCTIONS
  FUNCTION_READ,
  FUNCTION_LIST,
  FUNCTION_CREATE,
  FUNCTION_UPDATE,
  FUNCTION_DELETE,
  // COMBINED READ and LIST
  FUNCTION_READ_LIST
};
