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

// Developer Libraries //
import type { TPaging } from "./pager";
import utilities from './utilities';

async function myObjects(params?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

    // Request URL
    let url: string = "/me/objects";

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

    // Return Favorites Objects
    return _.get(response, "data.data.objects", []);
  } catch (e) {
    throw e;
  }
}

async function myFavorites(): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = "/me/favorites";

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

    // Return Favorites Objects
    return _.get(response, "data.data.objects", []);
  } catch (e) {
    throw e;
  }
}

async function myToggleFavorite(o: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/me/favorite/toggle/${o}`;

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

    // Return Favorites Links
    return _.get(response, "data.data.link", []);
  } catch (e) {
    throw e;
  }
}

async function myOrgs(params?: any, pager?: TPaging): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Have Pager Setttings
    if (pager != null) {
      if (pager.page_size !== "all") {
        params = {
          limit: pager.page_size,
          offset: (pager.page - 1) * (pager.page_size as number),
        };
      }
    }

    if (params != null) {
      options.params = params;
    }

    // Request URL
    let url: string = "/me/orgs";

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

    return response.data;
  } catch (e) {
    throw e;
  }
}

async function changePassword(currentPWD: string, newPassword: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Create JSON Request
    let json: any = {
      current: utilities.hash.calculate(currentPWD),
      "new": utilities.hash.calculate(newPassword)
    }

    // Request URL
    let url: string = "/me/password";

    // Request
    const response: any = await ws_client().post(url, json, options);
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

    return {
      error: false,
      message: "OK"
    }
  } catch (e) {
    if (e.isAxiosError) {
      return {
        error: true,
        message: e.message
      }
    }
    return {
      error: true,
      message: e.toString()
    }
  }
}

export default {
  password: changePassword,
  objects: {
    list: myObjects,
    orgs: myOrgs
  },
  favorites: {
    list: myFavorites,
    toggle: myToggleFavorite
  }
}
