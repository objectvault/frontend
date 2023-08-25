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
const CATEGORY_STORE: number = 0x0300;     // Store Management

// MANAGEMENT: SUB-CATEGORIES
const SUBCATEGORY_CONF: number = 0x0001;     // Configuration / Settings Management
const SUBCATEGORY_USER: number = 0x0002;     // User Management
const SUBCATEGORY_ROLES: number = 0x0003;    // User Roles Management
const SUBCATEGORY_INVITE: number = 0x0004;   // User Invitation
const SUBCATEGORY_ORG: number = 0x0005;      // Store Management
const SUBCATEGORY_STORE: number = 0x0006;    // Store Management
const SUBCATEGORY_OBJECT: number = 0x0007;   // Object Management
const SUBCATEGORY_TEMPLATE: number = 0x0008; // Template Management

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
const MASK_PERMISSIONS: number = 0x00000F0F; // Mask Valid Permission Bits
const MASK_ROLE: number = 0x0F0F0F0F; // Mask Valid Role Bits

// BITS offsets
const OFFSET_CATEGORY: number = 16;

// MAP of Categories to Functions in Category
export type TMapCategoryFunctions = { [key: number]: number };
export type TCategoryFilter = (c: number) => boolean;

const mapNoCategoryFunctions: TMapCategoryFunctions = {
  0x0101: 0x0, // SYSTEM: CONF
  0x0102: 0x0, // SYSTEM: USER
  0x0103: 0x0, // SYSTEM: ROLES
  0x0105: 0x0, // SYSTEM: ORG
  0x0108: 0x0, // SYSTEM: TEMPLATES
  0x0201: 0x0, // ORGANIZATION: CONF
  0x0202: 0x0, // ORGANIZATION: USER
  0x0203: 0x0, // ORGANIZATION: ROLES
  0x0204: 0x0, // ORGANIZATION: INVITATION
  0x0205: 0x0, // ORGANIZATION: ORGANIZATION
  0x0206: 0x0, // ORGANIZATION: STORE
  0x0208: 0x0, // ORGANIZATION: TEMPLATES
  0x0301: 0x0, // STORE: CONF
  0x0302: 0x0, // STORE: USER
  0x0303: 0x0, // STORE: ROLES
  0x0304: 0x0, // STORE: INVITATION
  0x0306: 0x0, // STORE: STORE PROFILE
  0x0307: 0x0, // STORE: OBJECTS
  0x0308: 0x0, // STORE: TEMPLATES
};

function role(category: number, functions: number): number {
  let c: number = category & MASK_CATEGORY_ANY;
  let f: number = functions & MASK_FUNCTION_ANY;
  return (c << OFFSET_CATEGORY) | f;
}

function roleCategory(role: number): number {
  let c: number = (role >> OFFSET_CATEGORY) & MASK_CATEGORY_ANY;
  return c;
}

function roleSubCategory(role: number): number {
  let s: number = (role >> OFFSET_CATEGORY) & MASK_SUBCATEGORY_ONLY;
  return s;
}

function subCategoryFromCategory(category: number): number {
  let s: number = (category & 0xFF);
  return s;
}

function roleFunctions(role: number): number {
  let f: number = (role & MASK_FUNCTION_ANY);
  return f;
}

function roleFunctionsKnown(role: number): number {
  let f: number = (role & MASK_FUNCTION_KNOWN);
  return f;
}

function hasFunction(role: number, f: number): boolean {
  let b: boolean = (role & (f & MASK_FUNCTION_ANY)) !== 0;
  return b;
}

function hasKnownFunction(role: number): boolean {
  return roleFunctionsKnown(role) !== 0;
}

function setFunction(role: number, f: number): number {
  const r: number = role | (f & MASK_FUNCTION_ANY);
  return r;
}

function clearFunction(role: number, f: number): number {
  const m = (~f) & 0xFFFFFFFF;
  const r: number = role & m;
  return r;
}

function toggleFunctions(role: number, f: number): number {
  const b: number = (role & (f & MASK_FUNCTION_ANY))
  const r = (b === 0) ? setFunction(role, f) : clearFunction(role, f);
  return r;
}

function isValidRole(role: number): boolean {
  return (role & MASK_ROLE) != 0;
}

function isEqualCategory(role: number, c: number): boolean {
  return roleCategory(role) === c;
}

function isEqualFunctions(role: number, f: number): boolean {
  return roleFunctions(role) === f;
}

function csvToRoles(csv: string): number[] {
  if (csv == null) {
    return [];
  }

  csv = csv.trim();
  if (csv.length == 0) {
    return [];
  }

  const roles: number[] = csv
    .split(",") // Explode String
    .map((v: string): number => {
      // Map to Integer
      const t: string = v.trim();
      return t.length ? parseInt(t) : null;
    })
    .filter((v: number): boolean => v != null && !isNaN(v)) // Filter out Invalid Values

  return roles;
}

function rolesToCSV(roles: number[]): string {
  if (!Array.isArray(roles) || (roles.length == 0)) {
    return "";
  }

  const csv: string = roles
    .filter((v: number) => v & MASK_FUNCTION_ANY)// Filter Roles with no Permissions
    .sort() // Order Ascending
    .join(","); // Implode
  return csv;
}

function extractRole(category: number,
  roles: number[],
  d?: number
) {
  // Calculate Role Category
  let c = (category & MASK_CATEGORY_ANY) << OFFSET_CATEGORY

  // Find Category in Roles
  let v: number = d == null ? c : d;
  for (const r of roles) {
    if ((r & MASK_CATEGORY) === c) {
      v = r;
    }
  }

  return v;
}

function mapRolesToCategory(roles: number[], all?: boolean | Function): { [key: number]: number } {
  let map: TMapCategoryFunctions = {};

  if (all != null) {
    switch (typeof all) {
      case "boolean":
        if (all) {
          map = { ...mapNoCategoryFunctions };
        }
        break;
      case "function":
        for (const key in mapNoCategoryFunctions) {
          if (mapNoCategoryFunctions.hasOwnProperty(key)) {
            if (all(key)) {
              map[key] = 0;
            }
          }
        }
    }
  }

  for (const role of roles) {
    // Is valid Role?
    if (!isValidRole(role)) { // No
      continue;
    }

    map[roleCategory(role)] = role;
  }

  return map;
}

export default {
  // FUNCTIONS
  FUNCTION_CREATE,
  FUNCTION_READ,
  FUNCTION_UPDATE,
  FUNCTION_DELETE,
  FUNCTION_LIST,
  FUNCTION_READ_LIST,
  // FUNCTION BIT MASKS
  MASK_FUNCTION_ANY,
  MASK_FUNCTION_READONLY,
  MASK_FUNCTION_MODIFY,
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
  SUBCATEGORY_TEMPLATE,
  // CATEGORY BIT MASKS
  MASK_CATEGORY_ANY,
  MASK_CATEGORY_ONLY,
  MASK_SUBCATEGORY_ONLY,
  OFFSET_CATEGORY,
  // Methods
  isValidRole,
  CSVToRoles: csvToRoles,
  rolesToCSV,
  role,
  extractRole,
  roleCategory,
  isEqualCategory,
  roleSubCategory,
  roleFunctions,
  isEqualFunctions,
  roleFunctionsKnown,
  hasFunction,
  hasKnownFunction,
  setFunction,
  clearFunction,
  toggleFunctions,
  mapRolesToCategory,
}
