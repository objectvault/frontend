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
import utilities from "../utilities";

async function isStoreSessionOpen(store: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/store/${store}/open`;

    // Request
    const response = await ws_client().get(url, options);
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

    return _.get(response, "data.data.open", false);
  } catch (e) {
    throw e;
  }
}

async function openStoreSession(org: string, store: string, password: string): Promise<any> {
  try {
    let options: any = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true,
    };

    // User Password Hash
    const hash: string = utilities.hash.calculate(password);

    // Create Form Parameters
    const formData: any = new FormData();
    formData.append("credentials", hash);

    // Request URL
    let url: string = `/org/${org}/store/${store}/open`;

    // Request
    const response = await ws_client().post(url, formData, options);
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

    return _.get(response, "data.data.store", null);
  } catch (e) {
    throw e;
  }
}

async function closeStoreSession(store: string): Promise<any> {
  throw "TODO: Implement"
}

export default {
  isOpen: isStoreSessionOpen,
  open: openStoreSession,
  close: closeStoreSession
}
