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
import utilities from "./utilities";

async function passwordRecover(email: string, params?: any): Promise<boolean> {
  try {
    let options: any = {};

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

    // Request URL
    let url: string = `/password/${email}`;

    // Request
    const response = await ws_client().delete(url, options);
    console.log(response);

    if (response.status != 200) {
      throw new Error("Not a Valid Response");
    }

    if (!response.hasOwnProperty("data")) {
      throw new Error("Not a Valid API Response");
    }

    let code = _.get(response, "data.code", null);
    if (code !== 1000) {
      throw new Error(`Unexpected Response Code [${code}]`);
    }

    // Get Organization Invites
    return true;
  } catch (e) {
    throw e;
  }
}

async function passwordReset(uid: string, password: string, params?: any): Promise<boolean> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

    // Create JSON Body by Calculate Password Hash
    const json: any = {
      hash: utilities.hash.calculate(password)
    }

    // Request URL
    let url: string = `/password/${uid}`;

    // Request
    const response = await ws_client().post(url, json, options);
    console.log(response);

    if (response.status != 200) {
      throw new Error("Not a Valid Response");
    }

    if (!response.hasOwnProperty("data")) {
      throw new Error("Not a Valid API Response");
    }

    let code = _.get(response, "data.code", null);
    if (code !== 1000) {
      throw new Error(`Unexpected Response Code [${code}]`);
    }

    // Get Organization Invites
    return _.get(response, "data.data.status", false);
  } catch (e) {
    throw e;
  }
}


export default {
  recover: passwordRecover,
  reset: passwordReset
}
