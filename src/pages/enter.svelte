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
  import apiSession from "../api/session";
  import EventEmitter from "../api/event-emitter";
  import { User } from "../classes/user";

  // ROUTING //
  import { push } from "svelte-spa-router";

  // STORES //
  import type { TAction } from "../objects/actions";
  import actionsStore from "../stores/taskbar-actions";
  import notifyStore from "../stores/notify";
  import sessionUser from "../stores/session-user";

  // Components //
  import Overlay from "../components/overlay.svelte";
  import Spinner from "../components/spinner.svelte";

  // Component Paramters //
  export const params: any = null; // IN: Router - Route Parameters

  // COMPONENT Bindable Paramters //
  let showSpinner: boolean = true; // DISPLAY: Spinner
  let user: any = null; // Session User

  // Registered Event Listener
  let nListenerID: number = null;

  // OBSERVABLES //
  $: notify = $notifyStore;

  // ACTIONS Handler //
  function onClickLogin(a: TAction) {
    EventEmitter.emit("do-login");
  }

  // Start Code //
  async function start(): Promise<any> {
    console.log("start: enter.svelte");

    // Display Spinner
    showSpinner = true;

    try {
      const m: any = await apiSession.hello();
      switch (m.code) {
        case 1000: // Already Logged In.
          const u: User = new User();
          if (!u.import(m.user)) {
            throw new Error("Invalid Session Response");
          }
          sessionUser.setUser(u);
          push("/home");
          break;
        case 1001: // Need to Log In.
          actionsStore.set([
            {
              id: "login",
              icon: "box-arrow-right",
              label: "Enter",
              handler: onClickLogin,
            },
          ]);
          break;
        default:
          throw new Error("Not a Valid API Response");
      }
    } catch (e: any) {
      // handle error
      notify(e.toString());
    } finally {
      /* DEBUG: Show Login Button
      actionsStore.set([
        {
          id: "login",
          icon: "box-arrow-right",
          label: "Enter",
          handler: onClickLogin,
        },
      ]);
      */

      // always executed
      showSpinner = false; // HIDE SPINNER
      console.log("Always Executed");
    }
  }

  // Start //
  const unsubscribe = sessionUser.subscribe((u: any) => {
    user = u;
  });

  onMount(() => {
    // Start Page
    start();
  });

  onDestroy(() => {
    unsubscribe();
    EventEmitter.removeListener(nListenerID);
  });
</script>

<section class="container">
  <div class="aligned column">Hero Content</div>
</section>

{#if showSpinner}
  <Overlay>
    <Spinner />
  </Overlay>
{/if}
