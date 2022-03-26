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
import axios from "axios";
import _ from "lodash";

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
    let url: string = `http://localhost:3000/1/org/${org}/users`;

    // Request
    const response = await axios.get(url, options);
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
    let url: string = `http://localhost:3000/1/org/${org}/user/${user}`;

    // Request
    const response = await axios.get(url, options);
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
    let url: string = `http://localhost:3000/1/org/${org}/user/${user}/roles`;

    // Request
    const response = await axios.put(url, `roles=${roles}`, options);
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

const roles: any = {
  get: getUserRoles,
  set: setUserRoles
}

export default {
  list: getUsers,
  get: getUser,
  roles
}
