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

export type TPaging = {
  page: number;  // Page Offset
  page_size: number | string; // Page Size
}

const pagingDefaults: TPaging = {
  page: 1,
  page_size: 'all'
}

export function pagerDefaults(): TPaging {
  return { ...pagingDefaults }
}

export function pager(page_size?: number | string, page?: number): TPaging {
  const p: TPaging = pagerDefaults();

  // Do we have a Page Size Set?
  if ((page_size != null) && (page_size !== "all")) { // YES
    p.page_size = page_size;

    if (page != null) {
      p.page = page;
    }
  }

  return p
}
