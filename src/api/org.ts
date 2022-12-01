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
import ws_client from "./ws";

import stores from "./org/org-store";
import users from "./org/org-user";
import invites from "./org/org-invite";
import state from "./org/org-state";
import templates from "./org/org-template";

async function getOrgProfile(org: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/org/${org}`;

    // Request
    const response: any = await ws_client().get(url, options);
    console.log(response);

    if (response.status != 200) {
      throw new Error("Not a Valid Response");
    }

    if (!response.hasOwnProperty("data")) {
      throw new Error("Not a Valid API Response");
    }

    const code: number = _.get(response, "data.code", null);
    if (code !== 1000) {
      throw new Error(`Unexpected Response Code [${code}]`);
    }

    return _.get(response, "data.data.organization", null);
  } catch (e) {
    throw e;
  }
}

async function deleteOrg(org: string): Promise<any> {
  try {
    throw new Error("TODO: IMPLEMENT");
  } catch (e) {
    throw e;
  }
}

export default {
  get: getOrgProfile,
  delete: deleteOrg,
  invites,
  state,
  stores,
  templates,
  users
}
