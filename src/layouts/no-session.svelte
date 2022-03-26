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
  import {
    Button,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
    Modal,
    ModalBody,
    ModalFooter,
  } from "sveltestrap";

  // Developer Libraries //
  import apiSession from "../api/session";

  // ROUTING //
  import { push } from "svelte-spa-router";

  // ACTIONS //
  import type { TAction } from "../objects/actions";
  import __actions from "../objects/actions";

  // STORES //
  import notifyStore from "../stores/notify";
  import actionsStore from "../stores/taskbar-actions";

  // TOASTER //
  import Toaster from "../components/toaster/toaster.svelte";
  import type { TNotify } from "../components/toaster/store";
  import toasterStore from "../components/toaster/store";

  // EVENT EMITTER //
  import EventEmitter from "../api/event-emitter";

  // Component Variables //
  export const title: string = "";

  // LOGIN Modal //
  let bOpenLoginModal: boolean = false;

  // PROPERTIES: Login Form //
  let sUser: string = "";
  let bInvalidUser: boolean = true;
  let sUserPassword: string = "";
  let bInvalidPassword: boolean = true;
  let bActiveEye: boolean = false;
  let arMessagesLoginForm: string[] = [];

  // Registered Event Listener
  let nListenerID: number = null;

  // OBSERVABLES //
  $: actions = $actionsStore;

  // HELPERS //
  function notify(m: any) {
    // Currrently Only Handle String Notification
    const n: TNotify = {
      body: m.toString(),
    };

    toasterStore.push(n);
  }

  // Login Form Validation //
  function validateLoginUser(): string[] {
    let arMessages: string[] = [];

    let u: string = sUser.trim();

    if (u.length !== sUser.length) {
      arMessages.push("User Can not contain spaces!");
    }

    if (u.length === 0) {
      arMessages.push("ID / Email / User Name Required");
    } else if (u.length < 5) {
      arMessages.push("Minimum User ID Length is 5!");
    } else if (u.length >= 30) {
      arMessages.push("User ID too long!");
    }

    return arMessages;
  }

  function validateLoginPassword(): string[] {
    let arMessages: string[] = [];

    let p: string = sUserPassword;

    if (p.length === 0) {
      arMessages.push("Password Required");
    } else if (p.length < 8) {
      arMessages.push("Minimum Password Length is 8!");
    }

    return arMessages;
  }

  function validateLoginForm(): string[] {
    const arUserMessages: string[] = validateLoginUser();
    const arPasswordMessages: string[] = validateLoginPassword();

    bInvalidUser = arUserMessages.length > 0;
    bInvalidPassword = arPasswordMessages.length > 0;
    return [...arUserMessages, ...arPasswordMessages];
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

  function onShowLoginModal(e: string): boolean {
    arMessagesLoginForm = validateLoginForm();
    bOpenLoginModal = true;
    return false;
  }

  function onToggleLoginModal(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    bOpenLoginModal = !bOpenLoginModal;
  }

  async function onSubmitLogin(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    // Set Form Login Messages if Any
    arMessagesLoginForm = validateLoginForm();

    // Get Current User
    sUser = sUser.trim();

    // We have Valid Information?
    if (arMessagesLoginForm.length === 0) {
      try {
        const u: any = await apiSession.login(sUser, sUserPassword);
        push("/home");
        return u;
      } catch (e) {
        // handle error
        notify(e.toString());
        console.log(e);

        // Apply Error Meesage to Login Dialog
        arMessagesLoginForm = ["Login Failed"];
      }
    }
  }

  function onShowPassword(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    // Toggle Active State for Eye
    bActiveEye = !bActiveEye;
  }

  // LIFECYCLE MANAGEMENT //
  onMount(() => {
    notifyStore.handler(notify);
    nListenerID = EventEmitter.on("do-login", onShowLoginModal);
  });

  onDestroy(() => {
    notifyStore.reset();
    EventEmitter.removeListener(nListenerID);
  });
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<Modal
  isOpen={bOpenLoginModal}
  toggle={onToggleLoginModal}
  centered={true}
  header="Create Session"
>
  <ModalBody>
    <form id="formLogin" class="my-2 needs-validation" novalidate>
      <div class="d-flex flex-column mx-auto" style="width: 80%;">
        <InputGroup class="d-flex mb-1">
          <InputGroupText id="lUser" class="col-3">User</InputGroupText>
          <Input
            id="iUser"
            type="text"
            class="col"
            placeholder="User"
            aria-label="User"
            aria-describedby="lUser"
            required
            invalid={bInvalidUser}
            bind:value={sUser}
          />
        </InputGroup>
        <InputGroup class="d-flex mb-3">
          <InputGroupText id="lPasswordLabel" class="col-3">
            Password
          </InputGroupText>
          <Input
            id="iUserPassword"
            type={bActiveEye ? "text" : "password"}
            class="col"
            placeholder="Password"
            aria-label="Password"
            aria-describedby="lPasswordLabel"
            required
            invalid={bInvalidPassword}
            bind:value={sUserPassword}
          />
          <Button
            class="col-auto input-group-text"
            tabindex={-1}
            on:click={onShowPassword}
          >
            <Icon name="eye" />
          </Button>
        </InputGroup>
        <a href="#" class="mb-2" tabindex={-1}>Lost Password?</a>
        <Button type="submit" color="primary" on:click={onSubmitLogin}>
          Sign In
        </Button>
      </div>
    </form>
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

<style lang="scss">
  main.container {
    height: 100vh;
  }
</style>
