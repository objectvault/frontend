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
import ws_templates from "../common/ws-template";

async function getTemplates(store: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/store/${store}/templates`;
  return ws_templates.list(url, params);
}

async function getTemplate(store: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/store/${store}/template/${name}`;
  return ws_templates.read(url, params);
}

async function addTemplate(store: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/store/${store}/template/${name}`;
  return ws_templates.add(url, params);
}

async function deleteTemplate(store: string, name: string, params?: any): Promise<any> {
  // Request URL
  let url: string = `/store/${store}/template/${name}`;
  return ws_templates.delete(url, params);
}

export default {
  list: getTemplates,
  get: getTemplate,
  add: addTemplate,
  delete: deleteTemplate
}
