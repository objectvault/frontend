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

  // SVELTE //
  import { onMount, onDestroy } from "svelte";

  // SVELTESTRAP //
  import { Button, Icon, Modal, ModalBody, ModalFooter } from "sveltestrap";

  // Developer Libraries //
  import apiSession from "../api/session";
  import { User } from "../classes/user";

  // ROUTING //
  import { push } from "svelte-spa-router";

  // ACTIONS //
  import type { TAction } from "../objects/actions";
  import __actions from "../objects/actions";

  // STORES //
  import sessionUser from "../stores/session-user";
  import notifyStore from "../stores/notify";
  import actionsStore from "../stores/taskbar-actions";

  // EVENT EMITTER //
  import EventEmitter from "../api/event-emitter";

  // TOASTER //
  import Toaster from "../components/toaster/toaster.svelte";
  import type { TNotify } from "../components/toaster/store";
  import toasterStore from "../components/toaster/store";

  // Component Variables //
  const title: string = "";

  // LOGIN Modal //
  let bDisplayLogoutModal: boolean = false;
  let arMessagesLoginForm: string[] = [];

  // Registered Event Listener
  let nListenerID: number = null;

  // Reactive Stores //
  $: user = $sessionUser;
  $: actions = $actionsStore;

  // HELPERS //
  function notify(m: any) {
    // Currrently Only Handle String Notification
    const n: TNotify = {
      body: m.toString(),
    };

    toasterStore.push(n);
  }

  // EVENT Handlers //
  function onProcessAction(id: string, e: any) {
    console.log(`Process Action [${id}]`);
    const action: TAction = __actions.actionInArray(actions, id);
    if (action != null && action.hasOwnProperty("handler")) {
      return action.handler(action);
    }

    console.error(`Action [${id}] does not exist or is invalid`);
  }

  function onShowLogoutModal(e: string): boolean {
    arMessagesLoginForm = [];
    bDisplayLogoutModal = true;
    return false;
  }

  function onToggleLogoutModal(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();
    bDisplayLogoutModal = !bDisplayLogoutModal;
  }

  async function onLogout(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    try {
      await apiSession.logout();
      sessionUser.setUser(null);
      push("/");
    } catch (e) {
      // handle error
      notify(e.toString());
      console.log(e);

      // Apply Error Meesage to Login Dialog
      arMessagesLoginForm = ["Logout Failed"];
    }
  }

  // Page Initialization //
  async function start() {
    console.log("start: session.svelte");

    try {
      if (user == null) {
        const m: any = await apiSession.hello();
        switch (m.code) {
          case 1000: // Already Logged In.
            const u: User = new User(m.user);
            sessionUser.setUser(u);
            break;
          case 1001: // Need to Log In.
            push("/");
            throw new Error("Please Login");
          default:
            push("/");
            throw new Error("Not a Valid API Response");
        }
      }
    } catch (e) {
      // handle error
      notify(e.toString());
    }
  }

  // LIFECYCLE MANAGEMENT //
  onMount(() => {
    // Setup Notification Handler
    notifyStore.handler(notify);
    nListenerID = EventEmitter.on("do-logout", onShowLogoutModal);
  });

  onDestroy(() => {
    // Release Notification Handler
    notifyStore.reset();
    EventEmitter.removeListener(nListenerID);
  });

  // Delay Start
  setTimeout(() => start(), 60);
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<Modal
  isOpen={bDisplayLogoutModal}
  toggle={onToggleLogoutModal}
  centered={true}
  header="Exit Session"
>
  <ModalBody>
    <div class="d-flex flex-column mx-auto" style="width: 80%;">
      <div class="row mb-3">
        <h4 class="col">Do you realy want to leave?</h4>
      </div>
      <div class="row d-flex justify-content-between">
        <Button
          type="submit"
          color="success"
          class="col-4"
          on:click={onToggleLogoutModal}
        >
          NO
        </Button>
        <Button type="submit" color="danger" class="col-4" on:click={onLogout}>
          YES
        </Button>
      </div>
    </div>
  </ModalBody>
  <ModalFooter class={arMessagesLoginForm.length ? "flex-column" : "d-none"}>
    {#each arMessagesLoginForm as message}
      <div class="col-12 text-danger">{message}</div>
    {/each}
  </ModalFooter>
</Modal>

<header class="site-header sticky-top pb-1">
  <nav class="d-flex flex-row justify-content-between py-1 bg-dark">
    <div class="col-auto d-flex flex-row align-items-center">
      <div class="col-auto">
        <a class="py-2" href="#" aria-label="Product">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            class="d-block mx-auto"
            role="img"
            viewBox="0 0 24 24"
          >
            <title>Logo</title>
            <circle cx="12" cy="12" r="10" />
            <path
              d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"
            />
          </svg>
        </a>
      </div>
      <div class="col-auto">
        <Button
          color="secondary"
          outline={true}
          href="#"
          class="btn-no-outline text-primary"
        >
          <Icon name="list" />
        </Button>
      </div>
    </div>
    <div class="col-auto">
      {user != null ? user.name() : ""}
    </div>
    <div class="col-auto">
      {#each actions as action (action.id)}
        <Button
          color="secondary"
          outline={true}
          on:click={(e) => onProcessAction(action.id, e)}
          class="btn-no-outline text-primary"
        >
          <Icon name={action.icon} />
          {action.label}
        </Button>
      {/each}
    </div>
  </nav>
</header>

<main class="container">
  <slot />
</main>

<!-- Maintain outside of main as it affects placement -->
<Toaster class="p-3 bg-secondary" />
