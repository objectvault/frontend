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

// Developer Libraries //
import type { TPaging } from "./pager";

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
    let url: string = "http://localhost:3000/1/me/objects";

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
    let url: string = "http://localhost:3000/1/me/favorites";

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
    let url: string = `http://localhost:3000/1/me/favorite/toggle/${o}`;

    // Request
    const response = await axios.put(url, null, options);
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
    let url: string = "http://localhost:3000/1/me/orgs";

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

    return response.data;
  } catch (e) {
    throw e;
  }
}

export default {
  objects: {
    list: myObjects,
    orgs: myOrgs
  },
  favorites: {
    list: myFavorites,
    toggle: myToggleFavorite
  }
}
