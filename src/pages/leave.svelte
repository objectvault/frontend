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

  // ROUTING //
  import { push } from "svelte-spa-router";

  // STORES //
  import type { TAction } from "../stores/taskbar-actions";
  import actionsStore from "../stores/taskbar-actions";

  // Component Paramters //
  export const params: any = null; // IN: Router - Route Parameters

  // ACTIONS Handler //
  function onClickHome(a: TAction) {
    console.log("Clicked Home");
    push(`/home`);
  }

  // START //
  actionsStore.append({
    id: "home",
    icon: "home",
    handler: onClickHome,
  });
</script>

<svelte:head>
  <title>ObjectVault - Good bye!</title>
</svelte:head>

<section class="h-screen mx-auto px-6">
  <div class="w-full text-center">Good Bye!!</div>
</section>
