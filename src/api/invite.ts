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

async function getInviteNoSession(inviteID: string, params?: any): Promise<any> {
  try {
    let options: any = {};

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

    // Request URL
    let url: string = `/invitation/${inviteID}`;

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

    // Get Organization Invites
    return _.get(response, "data.data.invitation", null);
  } catch (e) {
    throw e;
  }
}

async function acceptInvitation(uid: string, params: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/invitation/${uid}`;

    // Request
    const response: any = await ws_client().post(url, params, options);
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

    // Return User
    return _.get(response, "data.data.user", null);
  } catch (e) {
    throw e;
  }
}

async function declineInvitation(uid: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/invitation/${uid}`;

    // Request
    const response: any = await ws_client().delete(url, options);
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

    // Return Response (NULL)
    return _.get(response, "data", null);
  } catch (e) {
    throw e;
  }
}

async function getInvitations(objectID: string, params?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

    // Request URL
    let url: string = `/invites/${objectID}`;

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

    // Get Organization Invites
    return _.get(response, "data.data.invitations", null);
  } catch (e) {
    throw e;
  }
}

async function resendInvitation(id: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request URL
    let url: string = `/invite/${id}`;

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

    // Return User
    return _.get(response, "data.data", null);
  } catch (e) {
    throw e;
  }
}

async function deleteInvitation(id: string): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // TODO: Verify Implementation

    // Request URL
    let url: string = `/invite/${id}`;

    // Request
    const response: any = await ws_client().delete(url, options);
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

    // Return User
    return _.get(response, "data.data", null);
  } catch (e) {
    throw e;
  }
}

export default {
  invitation: {
    get: getInviteNoSession,
    accept: acceptInvitation,
    decline: declineInvitation,
  },
  // INVITATION Management //
  list: getInvitations,
  resend: resendInvitation,
  delete: deleteInvitation
}
