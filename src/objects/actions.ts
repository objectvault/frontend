/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
/* START.CHECKS */
import du from "../dev-utils";
/* END.CHECKS */

// Libraries //
import _ from "lodash";

// Define Action Handler
export type CBActionHandler = (action: TAction, o?: any) => void;
export type CBActionState = (action: TAction, o?: any) => boolean;

// Classes Categories for an Action
export type TActionClasses = {
  container?: string;
  icon?: string;
  label?: string;
  [key: string]: any;
}

// Definition for an Action
export type TAction = {
  id: string;
  icon?: string;
  label?: string;
  color?: string;
  tooltip?: string;
  classes?: TActionClasses;
  handler: CBActionHandler;
  display?: CBActionState;
  disabled?: CBActionState;
  [key: string]: any;
}

// Lodash Extension
function getStringDefaultOrNull(o: any, path: string, d?: string): string | null {
  const p: any = _.get(o, path);
  if (_.isString(p)) {
    return p;
  }

  /* START.CHECKS */
  ((d != null) && !_.isString(d)) && du.throwMessage('Invalid Value for Default');
  /* END.CHECKS */

  return d != null ? d : null;
}

function getHandlerOrNull(o: any, path: string, d?: string): any | null {
  const p: any = _.get(o, path);
  if (_.isFunction(p)) {
    return p;
  }

  /* START.CHECKS */
  ((d != null) && !_.isFunction(d)) && du.throwMessage('Invalid Value for Default');
  /* END.CHECKS */

  return d;
}

// Helpers
function getActionLabel(action: TAction, d?: string): string | null {
  return getStringDefaultOrNull(action, "label", d);
}

function getActionTooltip(action: TAction, d?: string): string | null {
  return getStringDefaultOrNull(action, "tooltip", d);
}

function getActionIcon(action: TAction, d?: string): string | null {
  return getStringDefaultOrNull(action, "icon", d);
}

function getBootstrapIcon(action: TAction, d?: string): string | null {
  const i: string | null = getActionIcon(action, d);
  return i !== null ? `bi-${i}` : null;
}

function getActionColor(action: TAction, d?: string): string {
  return getStringDefaultOrNull(action, "color", d);
}

function getActionClasses(action: TAction, category: string, d?: string): string | null {
  const c: any | null = _.get(action, "classes", null);
  return c !== null ? getStringDefaultOrNull(c, category, d) : null;
}

function getActionHandler(action: TAction, d?: any): CBActionHandler | null {
  return getHandlerOrNull(action, "handler", d);
}

function findActionInArray(actions: TAction[], id: string): TAction | null {
  const a: TAction = actions.find((a: TAction) => a.id == id);
  return a != null ? a : null;
}

function isActionDisplayed(action: TAction, o?: any): boolean {
  return action.display == null || action.display(action, o);
}

function isActionDisabled(action: TAction, o?: any): boolean {
  return action.disabled != null && action.disabled(action, o);
}

export default {
  label: getActionLabel,
  tooltip: getActionTooltip,
  classes: getActionClasses,
  actionIcon: getActionIcon,
  bootstrapIcon: getBootstrapIcon,
  actionColor: getActionColor,
  actionHandler: getActionHandler,
  actionInArray: findActionInArray,
  isActionDisplayed,
  isActionDisabled
}
