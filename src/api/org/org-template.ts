/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// cSpell:ignore ferreira, paulo, sourcenotes

// Libraries //
import ws_templates from "../common/ws-template";

async function getTemplates(org: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/templates`;
  return ws_templates.list(url, params);
}

async function getTemplate(org: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/template/${name}`;
  return ws_templates.read(url, params);
}

async function addTemplate(org: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/template/${name}`;
  return ws_templates.add(url, params);
}

async function deleteTemplate(org: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/org/${org}/template/${name}`;
  return ws_templates.delete(url, params);
}

async function getSystemTemplates(params?: any): Promise<any> {
  // Request URL
  let url: string = `/system/templates`;
  return ws_templates.list(url, params);
}

async function getSystemTemplate(name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/system/template/${name}`;
  return ws_templates.read(url, params);
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
