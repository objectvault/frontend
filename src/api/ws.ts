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
import axios, { AxiosInstance } from "axios";

// DEFAULT Request Timeout
const TIMEOUT: number = 1000;
const SERVER_URL: string = "http://localhost:3000";

// Create C-API Request Client (Unversioned)
const ws_client_unversioned: AxiosInstance = axios.create({
  baseURL: SERVER_URL,
  timeout: TIMEOUT
});

// Create C-API Request Client
const ws_client_versioned: AxiosInstance = axios.create({
  baseURL: `${SERVER_URL}/1`,
  timeout: TIMEOUT
});

// Using a Function to Make Things Extendible
function getWSClient(versioned = true): AxiosInstance {
  return versioned ? ws_client_versioned : ws_client_unversioned;
}

export default getWSClient;
