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


async function _getTemplates(url: string, params?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

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

    // Return User List
    return _.get(response, "data.data.templates", null);
  } catch (e) {
    throw e;
  }
}

async function _getTemplate(url: string, params?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

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

    // Return User List
    return _.get(response, "data.data.template", null);
  } catch (e) {
    throw e;
  }
}

async function _addTemplate(url: string, params?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Request
    const response = await ws_client().post(url, params, options);
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
    return _.get(response, "data.data.template", null);
  } catch (e) {
    throw e;
  }
}

async function _deleteTemplate(url: string, params?: any): Promise<any> {
  try {
    let options: any = {
      withCredentials: true,
    };

    // Do we have URL Params?
    if (params) {
      options.params = params;
    }

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

    // Return User List
    return _.get(response, "data.data.ok", false);
  } catch (e) {
    throw e;
  }
}

async function getTemplates(org: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/templates`;
  return _getTemplates(url, params);
}

async function getTemplate(org: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/template/${name}`;
  return _getTemplate(url, params);
}

async function addTemplate(org: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/template/${name}`;
  return _addTemplate(url, params);
}

async function deleteTemplate(org: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/template/${name}`;
  return _deleteTemplate(url, params);
}

async function getSystemTemplates(params?: any): Promise<any> {
  // Request URL
  let url: string = `/system/templates`;
  return _getTemplates(url, params);
}

async function getSystemTemplate(name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/system/template/${name}`;
  return _getTemplate(url, params);
}

export default {
  system: {
    list: getSystemTemplates,
    get: getSystemTemplate,
  },
  list: getTemplates,
  get: getTemplate,
  add: addTemplate,
  delete: deleteTemplate
}
