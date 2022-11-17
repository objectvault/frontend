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
  import { onMount, onDestroy, tick } from "svelte";

  // SVELTESTRAP //
  import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    Icon,
    Offcanvas,
  } from "sveltestrap";

  // Developer Libraries //
  import apiSession from "../api/session";
  import apiMe from "../api/me";
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

  // CUSTOM Components //
  import Toaster from "../components/toaster/toaster.svelte";
  import type { TNotify } from "../components/toaster/store";
  import toasterStore from "../components/toaster/store";
  import FormChangePassword from "../components/forms/form-change-password.svelte";
  import ModalMessage from "../components/modal-message.svelte";

  // Component Variables //
  const title: string = "";

  // LOGIN Modal //
  let bDisplayLogoutModal: boolean = false;
  let arMessagesLoginForm: string[] = [];

  // OFFCanvas //
  let sMessageChangePWD: string = null;
  let bOpenOffcanvas: boolean = false;
  const toggle = () => (bOpenOffcanvas = !bOpenOffcanvas);

  // Registered Event Listener
  let arListenerIDs: number[] = [];

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

  function actionsLogoutModal(): TAction[] {
    // Action List for Logout Confirmation Modal
    return [
      {
        id: "__close",
        label: "No",
        color: "success",
        display: () => false,
        handler: (a: TAction) => {
          console.info(`Clicked [${a.id}]`);
          bDisplayLogoutModal = false;
        },
        tooltip: "Cancel Logout",
      },
      {
        id: "__default",
        label: "YES",
        color: "danger",
        classes: {
          container: "col-4",
        },
        handler: async (a: TAction) => {
          try {
            console.info(`Clicked [${a.id}]`);
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
        },
        tooltip: "Terminate Session",
      },
    ];
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

  function onShowLogoutModal(e: MouseEvent, bHideOffcanvas = false): boolean {
    if (bHideOffcanvas) {
      bOpenOffcanvas = false;
    }

    arMessagesLoginForm = [];
    bDisplayLogoutModal = true;
    return false;
  }

  function onShowProfile(e: string): boolean {
    bOpenOffcanvas = true;
    console.log("Show Offcanvas");
    return false;
  }

  async function onChangePassword(e: CustomEvent) {
    const d: any = e.detail;
    console.log(`CURRENT [${d.current}] - NEW [${d.new}]`);
    try {
      const m: any = await apiMe.password(d.current, d.new);
      if (!m.error) {
        bOpenOffcanvas = false;
        sMessageChangePWD = null;
        d.reset();

        // Close Session
        await apiSession.logout();
        sessionUser.setUser(null);
        push("/");
      } else {
        sMessageChangePWD = m.message ? m.message : "Application Error";
      }
    } catch (e) {
      bOpenOffcanvas = false;
      notify(e.toString());
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
    arListenerIDs.push(EventEmitter.on("do-logout", onShowLogoutModal));
    arListenerIDs.push(EventEmitter.on("show-profile", onShowProfile));
  });

  onDestroy(() => {
    // Release Notification Handler
    notifyStore.reset();

    for (let id of arListenerIDs) {
      EventEmitter.removeListener(id);
    }
  });

  // Delay Start
  setTimeout(() => start(), 60);
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<ModalMessage
  isOpen={bDisplayLogoutModal}
  title="Exit Session"
  message="Do you realy want to leave?"
  actions={actionsLogoutModal()}
  messages={arMessagesLoginForm}
  centered={true}
/>

<header class="site-header sticky-top pb-1">
  <nav class="d-flex flex-row justify-content-between py-1 bg-dark">
    <div class="col-auto d-flex flex-row align-items-center">
      <div class="col-auto">
        <a class="py-2" href="#" aria-label="Logo">
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
          {action.label ? action.label : ""}
        </Button>
      {/each}
    </div>
  </nav>
</header>

<main class="container">
  <slot />

  <Offcanvas isOpen={bOpenOffcanvas} {toggle} header="Profile" placement="end">
    <Button color="danger" on:click={(e) => onShowLogoutModal(e, true)}>
      <Icon name="arrow-left" />
      Leave
    </Button>
    <hr />
    <Card>
      <CardHeader>
        <CardTitle class="mb-0">Change Password</CardTitle>
      </CardHeader>
      <CardBody>
        <FormChangePassword on:formSubmit={onChangePassword} />
      </CardBody>
      {#if sMessageChangePWD != null}
        <CardFooter>{sMessageChangePWD}</CardFooter>
      {/if}
    </Card>
  </Offcanvas>
</main>

<!-- Maintain outside of main as it affects placement -->
<Toaster class="p-3 bg-secondary" />
