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

async function getUsers(org: string, params?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

    // Request URL
    let url: string = `/org/${org}/users`;

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

    // Return User List
    return _.get(response, "data.data.users", null);
  } catch (e) {
    throw e;
  }
}

async function getUser(org: string, user: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/org/${org}/user/${user}`;

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

    return _.get(response, "data.data.user", null);
  } catch (e) {
    throw e;
  }
}

async function getUserRoles(org: string, user: string): Promise<any> {
  try {
    let u: any = await getUser(org, user);
    return _.get(u, "roles", "")
  } catch (e) {
    throw e;
  }
}

async function setUserRoles(org: string, user: string, roles: string): Promise<string> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/org/${org}/user/${user}/roles`;

    // Request
    const response: any = await ws_client().put(url, `roles=${roles}`, options);
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

    return _.get(response, "data.data.user.roles", "");
  } catch (e) {
    throw e;
  }
}

async function setUserBlockState(oid: string, uid: string, state: boolean): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/org/${oid}/user/${uid}/block/${state}`;

    // Request
    const response: any = await ws_client().put(url, null, options);
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

    return true;
  } catch (e) {
    throw e;
  }
}

async function setUserLockState(oid: string, uid: string, state: boolean): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/org/${oid}/user/${uid}/lock/${state}`;

    // Request
    const response: any = await ws_client().put(url, null, options);
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

    return true;
  } catch (e) {
    throw e;
  }
}

const roles: any = {
  get: getUserRoles,
  set: setUserRoles
}

export default {
  list: getUsers,
  get: getUser,
  block: (oid: string, uid: string) => setUserBlockState(oid, uid, true),
  unblock: (oid: string, uid: string) => setUserBlockState(oid, uid, false),
  lock: (oid: string, uid: string) => setUserLockState(oid, uid, true),
  unlock: (oid: string, uid: string) => setUserLockState(oid, uid, false),
  roles
}
