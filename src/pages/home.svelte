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

  // SVELTE API //
  import { onMount, onDestroy } from "svelte";

  // Developer Libraries //
  import EventEmitter from "../api/event-emitter";
  import type { User } from "../classes/user";
  import type { TAction } from "../objects/actions";

  // ROUTING //
  import { push } from "svelte-spa-router";

  // STORES //
  import actionsStore from "../stores/taskbar-actions";
  import notifyStore from "../stores/notify";
  import sessionUser from "../stores/session-user";

  // CUSTOM Components //
  import Overlay from "../components/overlay.svelte";
  import Spinner from "../components/spinner.svelte";
  import ObjectExplorer from "../components/explorer-objects.svelte";

  // Component Paramters //
  export let params: any = {}; // IN: Router - Route Parameters

  // Component Variables //
  let user: User = null;
  let spinner: boolean = false;

  // Reactive Stores //
  $: notify = $notifyStore;

  // DEBUG //
  $: console.log(params);

  // HELPERS //
  function hrefForObject(o: any) {
    const type: number = o.type;
    const id: string = o.object;

    switch (type) {
      case 2:
        return `#/org/${id}`;
      case 3:
        return `#/store/${id}`;
    }

    console.error(`Unexpected Object Type [${type}]`);
    return "#";
  }

  // EVENT Handlers //
  function onClickLogout(a: TAction) {
    EventEmitter.emit("do-logout");
  }

  function onClickObject(e: CustomEvent) {
    // Get Object
    const o: any = e.detail;

    // Navigate to Object Page
    const href: string = hrefForObject(o);
    push(href);
  }

  function onRemoveUserFromOrg(e: CustomEvent) {
    const org: number = e.detail;
    console.log(`TODO IMPLEMENT: onRemoveUser [${user.id}] FromOrg [${org}]`);
  }

  // Page Initialization //

  async function start() {
    console.log("start: home.svelte");
  }

  // Start //
  const unsubscribe = sessionUser.subscribe((u: any) => {
    if (u != null) {
      // Add Logout Action
      actionsStore.set([
        {
          id: "logout",
          icon: "box-arrow-left",
          label: "Leave",
          handler: onClickLogout,
        },
      ]);
    }
    user = u;
  });

  onMount(() => {
    start();
  });

  onDestroy(unsubscribe);
</script>

<main class="container">
  {#if spinner}
    <Overlay>
      <Spinner />
    </Overlay>
  {/if}

  {#if user != null}
    <ObjectExplorer on:click-object={onClickObject} />
  {/if}
</main>

<style>
  /*
  main {
    color: white;
    background-color: #5f1e02;
  }
  */
</style>
