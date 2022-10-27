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
import ws_client from "../ws";

// ALIAS: Common Invite Functions //
import invites from "../invite";

async function createInvite(org: string, invitation: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Service URL
    let url: string = `/org/${org}/invite`;

    // Request
    const response: any = await ws_client().post(url, invitation, options);
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

    // Return Invitation
    return _.get(response, "data.data.invitation", null);
  } catch (e) {
    throw e;
  }
}

export default {
  list: invites.list, // ALIAS
  create: createInvite,
  resend: invites.resend, // ALIAS
  delete: invites.delete // ALIAS
}
