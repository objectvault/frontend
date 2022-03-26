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
import _ from "lodash";

// Define Action Handler
export type CBActionHandler = (action: TAction, o?: any) => void;
export type CBActionState = (action: TAction, o?: any) => boolean;

// Definition for an Action
export type TAction = {
  id: string;
  icon: string;
  handler: CBActionHandler;
  display?: CBActionState;
  disabled?: CBActionState;
  color?: string;
  label?: string;
  tooltip?: string;
  [key: string]: any;
}

// Lodash Extension
function getStringOrNull(o: any, path: string, d?: string) {
  const p: any = _.get(o, path);
  if (_.isString(p)) {
    return p;
  }

  return _.isString(d) ? d : null;
}

function getHandlerOrNull(o: any, path: string, d?: string) {
  const p: any = _.get(o, path);
  if (_.isFunction(p)) {
    return p;
  }

  return _.isFunction(d) ? d : null;
}

// Helpers
function getActionLabel(action: TAction, d?: string): string {
  const i: string = getStringOrNull(action, "label", d);
  return i != null ? i : null;
}

function getActionTooltip(action: TAction, d?: string): string {
  const i: string = getStringOrNull(action, "tooltip", d);
  return i != null ? i : null;
}

function getActionIcon(action: TAction, d?: string): string {
  const i: string = getStringOrNull(action, "icon", d);
  return i != null ? i : null;
}

function getBootstrapIcon(action: TAction, d?: string): string {
  const i: string = getActionIcon(action, d);
  return i != null ? `bi-${i}` : null;
}

function getActionColor(action: TAction, d?: string): string {
  return getStringOrNull(action, "color", d);
}

function getActionHandler(action: TAction, d?: any): CBActionHandler {
  return getHandlerOrNull(action, "handler", d);
}

function findActionInArray(actions: TAction[], id: string): TAction {
  return actions.find((a: TAction) => a.id == id);
}

function isActionDisplayed(action: TAction): boolean {
  return action.display == null || action.display(action);
}

function isActionDisabled(action: TAction): boolean {
  return action.disabled != null && action.disabled(action);
}

export default {
  label: getActionLabel,
  tooltip: getActionTooltip,
  actionIcon: getActionIcon,
  bootstrapIcon: getBootstrapIcon,
  actionColor: getActionColor,
  actionHandler: getActionHandler,
  actionInArray: findActionInArray,
  isActionDisplayed,
  isActionDisabled
}
