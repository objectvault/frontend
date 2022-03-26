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
  import { onMount } from "svelte";

  // SVELTESTRAP //
  import {
    Button,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
    Modal,
    ModalBody,
  } from "sveltestrap";

  // Other Libraries //
  import _ from "lodash";
  import { validate } from "validate.js";

  // Developer Libraries //
  import apiSession from "../api/session";
  import apiInvite from "../api/invite";
  import { User } from "../classes/user";

  // ROUTING //
  import { replace } from "svelte-spa-router";

  // STORES //
  import sessionUser from "../stores/session-user";
  import notifyStore from "../stores/notify";

  // CUSTOM Components //
  import Overlay from "../components/overlay.svelte";
  import Spinner from "../components/spinner.svelte";
  import utilities from "../api/utilities";

  // Component Paramters //
  export let params: any = {}; // IN: Router - Route Parameters

  // COMPONENT Bindable Paramters//
  let spinner: boolean = false;
  let user: User = null; // Session User
  let invitation: any = null; // Invitation Object

  // Decline Invitation Modal Form //
  let openDeclineInviteModal: boolean = false;
  const toggleDeclineInviteModal = () => {
    openDeclineInviteModal = !openDeclineInviteModal;
  };

  // Login to Accept Invitation Modal Form //
  let openLoginAcceptModal: boolean = false;
  const toggleLoginAcceptModal = () => {
    openLoginAcceptModal = !openLoginAcceptModal;
  };

  // Create User to Accept Invitation Modal Form //
  let openCreateAcceptModal: boolean = false;
  const toggleCreateAcceptModal = () => {
    openCreateAcceptModal = !openCreateAcceptModal;
  };

  // FORM PROPERTIES //
  let sUser: string = "";
  let sUserName: string = "";
  let sPassword: string = "";
  let sPasswordConfirmation: string = "";
  let bInvalidPassword: boolean = true;
  let bInvalidConfirmation: boolean = true;
  let bActiveEye: boolean = false;

  // Reactive Stores //
  $: notifyPopUp = $notifyStore;

  // DEBUG //
  $: console.log(params);

  // HELPERS //
  function notify(n: any) {
    if (notifyPopUp) {
      (notifyPopUp as any)(n);
      return;
    }

    console.log(n);
  }

  // EVENTS //
  async function onDeclineInvitation(e: Event) {
    console.info(`${invitation.id} DECLINED`);
    toggleDeclineInviteModal();
  }

  async function onSimpleAccept(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    console.info(`${invitation.id} ACCEPTED`);

    const params: any = {
      session: true,
    };

    try {
      const u: any = await apiInvite.accept(invitation.id, params);
      toggleCreateAcceptModal();
    } catch (e) {
      console.error(e);
    }
  }

  async function onLoginAccept(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    console.info(`${invitation.id} Login to Accept`);

    const form: any = {
      invitee: invitation.invitee,
      password: sPassword,
    };

    console.info(form);

    let constraints = {
      invitee: {
        presence: { allowEmpty: false },
        email: true,
      },
      password: {
        presence: { allowEmpty: false },
        length: {
          minimum: 8,
          tooShort: "has to be atleast %{count} characters long",
        },
      },
    };

    const r: any = validate(form, constraints);
    if (r) {
      console.info(r);
      return;
    }

    try {
      // LOGIN
      await apiSession.login(form.invitee, form.password, {
        reset: user != null && user.email() != invitation.invitee,
        register: _.get(invitation, "register_session", false),
      });

      // ACCEPT Invitation
      const params: any = {
        session: true,
      };

      await apiInvite.accept(invitation.id, params);

      // Go to Home Page
      replace("/");
    } catch (e) {
      console.error(e);
    }
  }

  async function onCreateUserAccept(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    console.info(`${invitation.id} Create User to Accept`);

    const form: any = {
      name: sUserName,
      alias: invitation.alias,
      password: sPassword,
      confirmation: sPasswordConfirmation,
    };

    console.info(form);

    let constraints = {
      name: {
        presence: { allowEmpty: false },
        length: {
          minimum: 3,
          tooShort: "has to be atleast %{count} characters long",
        },
      },
      alias: {
        presence: { allowEmpty: false },
        length: {
          minimum: 6,
          tooShort: "has to be atleast %{count} characters long",
        },
      },
      password: {
        presence: { allowEmpty: false },
        length: {
          minimum: 8,
          tooShort: "has to be atleast %{count} characters long",
        },
      },
      confirmation: {
        equality: {
          attribute: "password",
          message: "does not match Password",
        },
      },
    };

    const r: any = validate(form, constraints);
    if (r) {
      console.info(r);
      return;
    }

    try {
      // Accept Invitation
      const user: any = await apiInvite.accept(invitation.id, {
        name: form.name,
        alias: form.alias,
        hash: utilities.hash.calculate(form.password),
      });

      // LOGIN
      await apiSession.login(user.id, form.password);

      // Go to Home Page
      replace("/");
    } catch (e) {
      console.error(e);
    }
  }

  function onShowPassword(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    // Toggle Active State for Eye
    bActiveEye = !bActiveEye;
  }

  // HELPERS //
  function onAcceptSwitch(e: Event) {
    let ri: boolean = _.get(invitation, "registered_invitee", false);
    let rs: boolean = _.get(invitation, "register_session", false);

    if (ri) {
      if (rs) {
        return toggleLoginAcceptModal();
      } else {
        return user != null ? onSimpleAccept(e) : toggleLoginAcceptModal();
      }
    } else {
      return toggleCreateAcceptModal();
    }
  }

  async function loadSessionUser(): Promise<any> {
    try {
      let m: any = await apiSession.hello();

      switch (m.code) {
        case 1000: // Already Logged In.
          const u: User = new User(m.user);
          sessionUser.setUser(u);
          return u;
        case 1001: // Need to Log In.
          return null;
      }

      throw new Error("Invalid Server Response");
    } catch (e) {
      throw e;
    }

    return false;
  }

  async function loadInvitation(uid: string): Promise<any> {
    try {
      let o: any = await apiInvite.getNoSession(uid);
      return o;
    } catch (e) {
      throw e;
    }
  }

  // Page Initialization //
  async function start() {
    try {
      // Show Spinner
      spinner = true;

      const uid: string = params.uid;

      // Get Current Session User if Any
      user = await loadSessionUser();

      // Load Invitation
      invitation = await loadInvitation(uid);

      if (user != null && user.email() != invitation.invitee) {
        throw new Error("Invitation is not for current Session User");
      }

      // Clear Spinner
      spinner = false;
    } catch (e) {
      // Log Error to Console
      console.error(e);

      // Redirect to Home Page
      replace(`/`);
    }
  }

  onMount(() => {
    start();
  });
</script>

<svelte:head>
  <title>ObjectVault - Organization [{params.org}]</title>
</svelte:head>

<Modal
  isOpen={openDeclineInviteModal}
  toggle={toggleDeclineInviteModal}
  centered={true}
  header="Decline Invitation?"
>
  <ModalBody>
    <p>Do you really want to decline?</p>
    <p>
      <b>Please note:</b> if you decline the invitation, it will be removed from
      our systems, and, you will have to be <b>re</b>invited in order to access
      our services.
    </p>
    <div class="d-flex flex-column mx-auto" style="width: 80%;">
      <div class="row d-flex justify-content-between">
        <Button
          type="submit"
          color="success"
          class="col-4"
          on:click={toggleDeclineInviteModal}
        >
          NO
        </Button>
        <Button
          type="submit"
          color="danger"
          class="col-4"
          on:click={onDeclineInvitation}
        >
          YES
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>

<Modal
  isOpen={openLoginAcceptModal}
  toggle={toggleLoginAcceptModal}
  centered={true}
  header="Login to Accept Invitation"
>
  <ModalBody>
    <form id="formLogin" class="my-2 needs-validation" novalidate>
      <div class="d-flex flex-column mx-auto" style="width: 80%;">
        <InputGroup class="d-flex mb-1">
          <InputGroupText id="lUserEmail" class="col-3">User</InputGroupText>
          <Input
            type="text"
            class="col"
            placeholder="Your email"
            aria-label="Youe email"
            aria-describedby="lUserEmail"
            required
            bind:value={invitation.invitee}
            disabled
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
            bind:value={sPassword}
          />
          <Button
            class="col-auto input-group-text"
            tabindex={-1}
            on:click={onShowPassword}
          >
            <Icon name="eye" />
          </Button>
        </InputGroup>
        <Button type="submit" color="primary" on:click={onLoginAccept}>
          Sign In
        </Button>
      </div>
    </form>
  </ModalBody>
</Modal>

<Modal
  isOpen={openCreateAcceptModal}
  toggle={toggleCreateAcceptModal}
  centered={true}
  header="Create a User to Accept Invitation"
>
  <ModalBody>
    <form id="formLogin" class="my-2 needs-validation" novalidate>
      <div class="d-flex flex-column mx-auto" style="width: 80%;">
        <InputGroup class="d-flex mb-1">
          <InputGroupText id="lUserName" class="col-3">Name</InputGroupText>
          <Input
            type="text"
            class="col"
            placeholder="Your Name"
            aria-label="Your Name"
            aria-describedby="lUserName"
            bind:value={sUserName}
          />
        </InputGroup>
        <InputGroup class="d-flex mb-1">
          <InputGroupText id="lUserAlias" class="col-3">Alias</InputGroupText>
          <Input
            type="text"
            class="col"
            aria-label="User Alias"
            aria-describedby="lUserAlias"
            bind:value={invitation.alias}
          />
        </InputGroup>
        <hr />
        <InputGroup class="d-flex mb-1">
          <InputGroupText id="lPasswordLabel" class="col-4">
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
            bind:value={sPassword}
          />
          <Button
            class="col-auto input-group-text"
            tabindex={-1}
            on:click={onShowPassword}
          >
            <Icon name="eye" />
          </Button>
        </InputGroup>
        <InputGroup class="d-flex mb-3">
          <InputGroupText id="lPasswordLabel" class="col-4">
            Confirmation
          </InputGroupText>
          <Input
            id="iUserPassword"
            type="password"
            class="col"
            placeholder="Password"
            aria-label="Password"
            aria-describedby="lPasswordLabel"
            required
            invalid={bInvalidConfirmation}
            bind:value={sPasswordConfirmation}
          />
        </InputGroup>

        <Button type="submit" color="primary" on:click={onCreateUserAccept}>
          Create
        </Button>
      </div>
    </form>
  </ModalBody>
</Modal>

<main class="container">
  {#if spinner}
    <Overlay>
      <Spinner />
    </Overlay>
  {/if}

  {#if invitation != null}
    <div class="card mb-3">
      <h3 class="card-header d-flex">INVITATION</h3>
      <div class="card-body">
        <p>You have been invited to join Object Vault.</p>
        <p>
          You should have received an email from [{invitation.creator}] with
          this link and a message explaining the reason for the inviation.
        </p>
        <div class="row">
          <p class="col-6 text-center">To accept the invitation</p>
          <p class="col-6 text-center">
            If you <b>do not</b> accept the invitation
          </p>
        </div>
        <div class="row">
          <span class="col-6 text-center">
            <Button
              type="submit"
              color="success"
              class="col"
              on:click={onAcceptSwitch}
            >
              Accept
            </Button>
          </span>
          <span class="col-6 text-center">
            <button
              type="button"
              class="btn btn-danger"
              on:click={toggleDeclineInviteModal}
            >
              Decline
            </button>
          </span>
        </div>
      </div>
    </div>
  {:else}
    <h1>Loading Invitation</h1>
  {/if}
</main>
