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
import forge from "node-forge";

// CONSTANTS //
const OTYPE_NOTSET: number = 0;
const OTYPE_USER: number = 0x01;
const OTYPE_ORG: number = 0x02;
const OTYPE_STORE: number = 0x03;
const OTYPE_INVITATION: number = 0xFE;
const OTYPE_OTHER: number = 0xFF;

// INTERNAL //
function toClassName(value: any) {
  let result = "";

  if (typeof value === "string" || typeof value === "number") {
    result += value;
  } else if (typeof value === "object") {
    if (Array.isArray(value)) {
      result = value.map(toClassName).filter(Boolean).join(" ");
    } else {
      for (let key in value) {
        if (value[key]) {
          result && (result += " ");
          result += key;
        }
      }
    }
  }

  return result;
}

function conicalShardID(sid: string): string {
  /* NOTE: Due to the limitation in the size of a number
   * (i.e. 64 bit integers are stored as rounded exponent decimals)
   * all shard object ids are stored in a hex decimal string with a
   * prefix of ':'
   */
  sid = sid != null ? sid.trim() : null;
  if ((sid === null) || (sid.length < 2) || (sid[0] != ':')) {
    return null;
  }

  // Pad ID with leading zeros
  sid = '0000000000000000' + sid.substr(1);
  return sid.substr(-16);
}

function extractOjectType(sid: string): number {
  if ((sid == null) || (sid.length != 16)) {
    return null;
  }

  const sidType: string = sid.substr(2, 2);
  const iType = parseInt(sidType, 16);
  return iType != NaN ? iType : null;
}

// HELPERS //
function hashString(s: string): string {
  const md = forge.md.sha256.create();
  md.update(s);
  return md.digest().toHex();
}

function mergeClasses(...args) {
  return args.map(toClassName).filter(Boolean).join(" ");
}

// String has Unescaped Asterisks?
function hasAsterisk(v: string): boolean {
  const ia: number = v.indexOf("*");

  if (ia < 0) {
    return false;
  }

  if (ia === 0) {
    return true;
  }

  if (ia === 1) {
    return v[0] !== "\\";
  }

  let countLeadingSlash: number = 0;
  for (let i = ia - 1; i >= 0; --i) {
    if (v[i] === "\\") {
      ++countLeadingSlash;
      continue;
    }
    break;
  }

  return countLeadingSlash % 2 == 0;
}

function isOrganizationObject(id: string): boolean {
  const iType: number = extractOjectType(conicalShardID(id));
  return iType === OTYPE_ORG;
}

function isStoreObject(id: string): boolean {
  const iType: number = extractOjectType(conicalShardID(id));
  return iType === OTYPE_STORE;
}

// HELPERS //
function isString(s: string): boolean {
  return (s != null) && (typeof (s) === "string");
}

function isStringNullOrEmpty(s: string): boolean {
  return isString(s) ? s.trim().length === 0 : true;
}

function defaultOnEmpty(s: string, d = null): string {
  if (isString(s)) {
    s = s.trim()
    return s.length === 0 ? d : s;
  }

  return d;
}

export default {
  strings: {
    isString: isString,
    isNullOrEmpty: isStringNullOrEmpty,
    defaultOnEmpty: defaultOnEmpty
  },
  hash: {
    calculate: hashString
  },
  classes: {
    merge: mergeClasses
  },
  object: {
    isOrganization: isOrganizationObject,
    isStore: isStoreObject
  },
  hasAsterisk
}
