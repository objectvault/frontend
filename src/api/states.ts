/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// OBJECT STATES
const STATE_INACTIVE: number = 0x0001; // User Locked Out of System
const STATE_BLOCKED: number = 0x0002; // User/Organization Blocked (but not deleted) from System
const STATE_READONLY: number = 0x0004; // User/Organization Disabled All Modification Roles

// OBJECT MARKERS
const STATE_SYSTEM = 0x1000; // SYSTEM User/Organization
const STATE_DELETE = 0x2000; // Object Marked for Deletion

// MASKS
const MASK_OBJECT_STATES: number = 0xF00F;  // Mask Valid Object States
const MASK_OBJECT_MARKERS: number = 0xF00F; // Mask Valid Object Markers
const MASK_STATES_ANY: number = MASK_OBJECT_STATES | MASK_OBJECT_STATES; // MASK ALL

function hasState(states: number, f: number): boolean {
  let b: boolean = (states & (f & MASK_STATES_ANY)) !== 0;
  return b;
}

function setState(states: number, f: number): number {
  const s: number = states | (f & MASK_STATES_ANY);
  return s;
}

function clearState(states: number, f: number): number {
  const m = (~f) & 0xFFFFFFFF;
  const s: number = states & m;
  return s;
}

function toggleState(states: number, f: number): number {
  const b: number = (states & (f & MASK_STATES_ANY))
  const r = (b === 0) ? setState(states, f) : clearState(states, f);
  return r;
}

function isValidState(states: number): boolean {
  return (states & MASK_STATES_ANY) != 0;
}

export default {
  // OBJECT STATES
  STATE_INACTIVE,
  STATE_BLOCKED,
  STATE_READONLY,
  // OBJECT MARKERS
  STATE_SYSTEM,
  STATE_DELETE,
  // MASKS
  MASK_OBJECT_STATES,
  MASK_OBJECT_MARKERS,
  MASK_STATES_ANY,
  // METHODS
  hasState,
  setState,
  clearState,
  toggleState,
  isValidState
}
