<script lang="ts">
  /*
   * This file is part of the ObjectVault Project.
   * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
   *
   * This work is published under the GNU AGPLv3.
   *
   * You should have received a copy of the GNU Affero General Public License
   * along with this program.  If not, see <https://www.gnu.org/licenses/>.
   */

  import LoginIcon from "./icons/login.svelte";
  import LogoutIcon from "./icons/logout.svelte";
  import IconButton from "./icon-button.svelte";
  import axios from "axios";

  let authenticated: boolean = false;

  async function onLogin() {
    console.log("Logging In");
    try {
      await axios.post(
        "http://localhost:3000/session/login/admin",
        "password=admin:admin" // application/x-www-form-urlencoded
      );
      authenticated = true;
    } catch (e) {
      console.log(e);
    }
  }

  async function onLogout() {
    console.log("Logging In");
    try {
      await axios.delete("http://localhost:3000/session/logout");
      authenticated = false;
    } catch (e) {
      console.log(e);
    }
  }
</script>

<nav>
  {#if !authenticated}
    <IconButton on:click={onLogin}>
      <LoginIcon color="#ccc" size="1.5em" />
    </IconButton>
  {:else}
    <IconButton on:click={onLogout}>
      <LogoutIcon color="#ccc" size="1.5em" />
    </IconButton>
  {/if}
</nav>

<style>
  nav {
    height: 5rem;
    top: 0;
    left: 0;
    width: 100%;
    position: absolute;
    background-color: orangered;
    display: flex;
    flex-direction: row;
    justify-items: flex-end;
  }
</style>
