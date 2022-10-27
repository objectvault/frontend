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

async function hello(): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Service URL
    let url: string = "/session";

    // Request
    const response: any = await ws_client(false).get(url, options);
    console.log(response);

    if (response.status != 200) {
      throw new Error("Not a Valid Response");
    }

    if (!response.hasOwnProperty("data")) {
      throw new Error("Not a Valid API Response");
    }

    let code: number = _.get(response, "data.code", null);
    if ((code !== 1000) && (code !== 1001)) {
      throw new Error(`Unexpected Response Code [${code}]`);
    }

    const user: any = code === 1000 ? _.get(response, "data.data.user", null) : null;
    return { code, user };
  } catch (e) {
    throw e;
  }
}

async function login(user: number | string, password: string, json?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Create JSON Body
    if (json == null) {
      json = {
        reset: true,  // Reset User Session
        register: false, // Register User Password
      }
    }

    // Add User Hash
    json.hash = utilities.hash.calculate(password);

    // Service URL
    let url: string = `/session/${user}`;

    // Request
    const response: any = await ws_client().post(url, json, options);
    console.log(response);

    if (response.status != 200) {
      throw new Error("Not a Valid Response");
    }

    if (!response.hasOwnProperty("data")) {
      throw new Error("Not a Valid API Response");
    }

    let code: number = _.get(response, "data.code", null);
    if (code !== 1000) {
      throw new Error(`Unexpected Response Code [${code}]`);
    }

    return _.get(response, "data.data.user", null);
  } catch (e) {
    throw e;
  }
}

async function logout(): Promise<number> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Service URL
    let url: string = `/session`;

    // Request
    const response: any = await ws_client().delete(url, options);
    console.log(response);

    if (response.status != 200) {
      throw new Error("Not a Valid Response");
    }

    if (!response.hasOwnProperty("data")) {
      throw new Error("Not a Valid API Response");
    }

    let code: number = _.get(response, "data.code", null);
    if (code !== 1000) {
      throw new Error(`Unexpected Response Code [${code}]`);
    }

    return code;
  } catch (e) {
    throw e;
  }
}

export default {
  hello,
  login,
  logout
}
