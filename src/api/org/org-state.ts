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

async function setOrgLockState(org: string, flag: boolean): Promise<number> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `http://localhost:3000/1/org/${org}/lock/${flag}`;

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

    return _.get(response, "data.data", null);
  } catch (e) {
    throw e;
  }
}

async function setOrgBlockState(org: string, flag: boolean): Promise<number> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `http://localhost:3000/1/org/${org}/block/${flag}`;

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

    return _.get(response, "data.data", null);
  } catch (e) {
    throw e;
  }
}

export default {
  lock: {
    set: setOrgLockState
  },
  block: {
    set: setOrgBlockState
  }
}
