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
  import { onDestroy } from "svelte";

  // SVELTESTRAP //
  import {
    Button,
    Form,
    FormGroup,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "sveltestrap";

  // STORES //
  import sessionUser from "../../stores/session-user";
  import actionsStore from "../../stores/taskbar-actions";
  import notifyStore from "../../stores/notify";

  // Other Libraries //
  import _ from "lodash";
  import { validate } from "validate.js";

  // WebServices API Library //
  import apiSession from "../../api/session";
  import apiStore from "../../api/store";
  import apiRoles from "../../api/roles";

  // Developer Libraries //
  import EventEmitter from "../../api/event-emitter";
  import type { User } from "../../classes/user";
  import { Role, Roles } from "../../classes/roles";
  import { Store } from "../../classes/store";
  import { StoreUser } from "../../classes/store-user";
  import type { TAction } from "../../objects/actions";
  import type { TSingleFieldList } from "../../objects/single-field-list";
  import sflUtilities from "../../objects/single-field-list";

  // CUSTOM Components //
  import Overlay from "../../components/overlay.svelte";
  import Spinner from "../../components/spinner.svelte";
  import SingleFieldExplorer from "../../components/list-single-field.svelte";
  import RolesManager from "../../components/roles-manager.svelte";

  // Component Paramters //
  export let params: any = {}; // IN: Router - Route Parameters

  // COMPONENT Bindable Paramters//
  let spinner: boolean = false;
  let user: User = null; // Session User
  let store: Store = null; // Store Profile
  let storeUser: StoreUser = null; // Registry: Store Session User Registry
  let listOfInvitations: any = null; // List of Pending User Invitations
  let invitations: any[] = []; // Invitations Array

  // Invitation Modal Form //
  let inviteOpen: boolean = false;
  let inviteEmail: string = "";
  let inviteMessage: string = "";
  let inviteRefresh: any = null; // Invitation Refresh Callback
  let inviteRoles: Roles = new Roles("50724865,50790403");
  let invitePassword: string = "";
  let inviteShowPassword: boolean = false;
  let inviteInvalidPassword: boolean = true;
  // NOTE: Store READ Role (50724865) is REQUIRED and HIDDEN in invitation

  const toggleInvitationModal = (refresh = null) => {
    inviteRefresh = refresh;
    inviteOpen = !inviteOpen;
  };

  // User Permissions Modal Form //
  let rolesModifyModalOpen: boolean = false;
  let roleModifyEntry: StoreUser = null;
  let rolesReadOnly: boolean = false;
  let rolesToModify: any = null;
  let updatedRoles: Roles = null;

  const toggleRolesModifyModal = () =>
    (rolesModifyModalOpen = !rolesModifyModalOpen);

  // Reactive Statements //
  $: sflUsersList = createUsersList(params.store);
  $: sflInvitationsList = createInvitationsList(params.store);

  // Reactive Stores //
  $: notifyPopUp = $notifyStore;

  // DEBUG //
  $: console.log(params);

  // EVENTS //
  function onClickLogout(a: TAction) {
    EventEmitter.emit("do-logout");
  }

  function onToggleInviteShowPassword(e: Event) {
    inviteShowPassword = !inviteShowPassword;
  }

  function onInvitationRolesModification(e: CustomEvent) {
    const v: number = e.detail.value;
    console.info(v.toString(16));
    inviteRoles.set(v);
  }

  async function onSubmitInvitation(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    const invitation: any = {
      invitee: inviteEmail.trim().toLowerCase(),
      message: inviteMessage.trim(),
      roles: inviteRoles.export(),
      password: invitePassword,
    };

    let constraints = {
      invitee: {
        presence: { allowEmpty: false },
        email: true,
      },
      message: {
        presence: { allowEmpty: true },
      },
      password: {
        presence: { allowEmpty: false },
        length: { minimum: 8 },
      },
    };

    const r: any = validate(invitation, constraints);
    if (r) {
      console.info(r.invitee[0]);
      return;
    }

    try {
      // Calculcate Password Hash
      let s: any = apiSession.login(user.id(), invitation.password, {
        reset: false,
        register: true,
      });
      delete invitation.password;

      // Create Store Invite
      let i: any = await apiStore.invites.create(params.store, invitation);
      if (inviteRefresh && _.isFunction(inviteRefresh)) {
        await inviteRefresh();
      }
      toggleInvitationModal();
    } catch (e) {
      console.error(e);
    }
  }

  async function onSubmitModifyUserRoles(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Entry Roles (SOURCE)
    const me: StoreUser = roleModifyEntry;
    const s: Roles = me.roles();
    console.info(s.export());
    if (updatedRoles != null) {
      console.info(updatedRoles.export());
      s.merge(updatedRoles);
      console.info(s.export());

      try {
        let m: any = await apiStore.users.roles.set(
          me.store(),
          me.user(),
          s.export()
        );
        console.info(m);
      } catch (e) {
        console.error(e);
      }
    } else {
      console.info("No Roles to Modify");
    }

    toggleRolesModifyModal();
  }

  function onUserRolesModification(e: CustomEvent) {
    const v: number = e.detail.value;
    const r: Role = new Role(v);

    // Have Updated Roles?
    if (updatedRoles == null) {
      // NO: Create Container
      updatedRoles = new Roles();
    }
    updatedRoles.add(r);
    console.log(e);
  }

  // HELPERS //
  function notify(n: any) {
    if (notifyPopUp) {
      (notifyPopUp as any)(n);
      return;
    }

    console.log(n);
  }

  function isSelf(id: string): boolean {
    // TODO: Check if ID Given Matches Session User ID
    return user != null && id == user.id();
  }

  function invitationRolesToManagerList(): any {
    return {
      Functions: [
        {
          id: "store",
          label: "Store",
          icon: "sd-card",
          value: 0x03060003,
          fixed: 0x0003,
        },
        {
          id: "object",
          label: "Objects",
          icon: "archive",
          value: 0x03070003,
          fixed: 0x0003,
        },
      ],
    };
  }

  function csvRolesToManagerList(r: Roles): any[] {
    // STORE LEVEL : ROLES //
    // apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_CONF   (ALL - STORE CONFIGURATION)
    // apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_USER   (RL, D)
    // apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_ROLES  (RL, U)
    // apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_INVITE (RL, C, D)
    // apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_STORE  (R)
    // apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_OBJECT (ALL)

    // Current Roles
    const roles: number[] = apiRoles.CSVToRoles(r.export());

    const store_admin_roles: any[] = [
      {
        id: "conf",
        label: "Settings",
        icon: "gear-fill",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_CONF,
          roles
        ),
      },
      {
        id: "user",
        label: "User",
        icon: "person",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_USER,
          roles
        ),
        fixed: apiRoles.FUNCTION_CREATE,
      },
      {
        id: "roles",
        label: "Roles",
        icon: "lock",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_ROLES,
          roles
        ),
        fixed: apiRoles.FUNCTION_CREATE | apiRoles.FUNCTION_DELETE,
      },
      {
        id: "invite",
        label: "Invites",
        icon: "envelope",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_INVITE,
          roles
        ),
        fixed: apiRoles.FUNCTION_UPDATE,
      },
      {
        id: "store",
        label: "Store",
        icon: "sd-card",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_STORE,
          roles
        ),
        fixed: apiRoles.FUNCTION_CREATE | apiRoles.FUNCTION_DELETE,
      },
    ];

    const store_object_roles: any[] = [
      {
        id: "object",
        label: "Object",
        icon: "sd-card",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_OBJECT,
          roles
        ),
      },
    ];

    const roles_list: any = {
      Administration: store_admin_roles,
      Object: store_object_roles,
    };
    return roles_list;
  }

  function entryActionsUsersList(entry: StoreUser): TAction[] {
    /* CONDITIONS:
     * IS SELF : Read Only (Can't Edit)
     * IS Not Self : Depends on Permissions
     */
    const self: boolean = isSelf(entry.user());
    const isAdmin: boolean = entry.isAdmin();

    return [
      {
        id: "user.permissions",
        icon: "unlock-fill",
        color: "primary",
        handler: (a: TAction) => {
          console.info(`Clicked [${a.id}] on [${entry.username()}]`);
          roleModifyEntry = entry;
          rolesToModify = csvRolesToManagerList(entry.roles());
          updatedRoles = null;
          rolesReadOnly = self;
          toggleRolesModifyModal();
        },
        label: "Roles",
        tooltip: self ? "View My Permissions" : "Modify User Permissions",
      },
      {
        id: "user.delete",
        icon: "trash",
        color: "danger",
        handler: (a: TAction) =>
          console.info(`Clicked [${a.id}] on [${entry.username()}]`),
        display: () => !self,
        label: "Delete",
        tooltip: "Remove User from Store",
      },
      {
        id: "admin.toggle",
        icon: isAdmin ? "star-fill" : "star",
        color: isAdmin ? "warning" : "danger",
        handler: (a: TAction) =>
          console.info(`Clicked [${a.id}] on [${entry.username()}]`),
        disabled: () => self,
        label: "Admin",
        tooltip: isAdmin ? "Remove Admin Status" : "Make Admin",
      },
    ];
  }

  function createUsersList(store: string): TSingleFieldList {
    // Create Basic SFL Object
    const l: TSingleFieldList = {
      header: {
        title: "Users",
      },
      filter: sflUtilities.standardFilterObject(
        "username",
        null,
        "Filter by User Name"
      ),
      entry: sflUtilities.standardEntryObject(
        "user",
        "username",
        "person-fill"
      ),
      entryActions: entryActionsUsersList,
      loader: null,
    };

    // Create Loader
    l.loader = async (): Promise<any> => {
      let fv: string = l.filter.get();
      let list: any = null;

      if (fv.length) {
        const filter: string = `contains(username, "${fv}")`;
        list = await apiStore.users.list(store, { filter });
      } else {
        list = await apiStore.users.list(store);
      }

      // Map List Items
      list.items = list.items.map((i: any) => new StoreUser(i));
      return list;
    };
    return l;
  }

  function entryActionsInvitationsList(entry: any): TAction[] {
    return [
      {
        id: "invite.delete",
        icon: "dash-circle",
        color: "danger",
        handler: (a: TAction, entry: any) =>
          console.info(`Clicked [${a.id}] on [${entry.username}]`),
        label: "Delete",
        tooltip: "Delete Invitation",
      },
    ];
  }

  function listActionsInvitationsList(entry: any): TAction[] {
    return [
      {
        id: "invite.create",
        icon: "plus-square",
        color: "primary",
        handler: (a: TAction) => {
          // TODO: Fix Hack
          const refresh: any = _.get(a, "__reloadList", null);
          toggleInvitationModal(refresh);
        },
        label: "Create",
        tooltip: "Create Invitation",
      },
    ];
  }

  function createInvitationsList(store: string): TSingleFieldList {
    // Create Basic SFL Object
    const l: TSingleFieldList = {
      listActions: listActionsInvitationsList,
      header: {
        title: "Invitations",
      },
      filter: sflUtilities.standardFilterObject(
        "invitee",
        null,
        "Filter by Email"
      ),
      entry: sflUtilities.standardEntryObject("id", "invitee", "envelope-fill"),
      entryActions: entryActionsInvitationsList,
      loader: null,
    };

    // Create Loader
    l.loader = async (): Promise<any> => {
      let fv: string = l.filter.get();
      if (fv.length) {
        const filter: string = `contains(invitee, "${fv}")`;
        return apiStore.invites.list(store, { filter });
      } else {
        return apiStore.invites.list(store);
      }
    };
    return l;
  }

  async function reloadInvitations(id: string): Promise<any> {
    try {
      // Reload nvitations List
      const list: any = await apiStore.invites.list(id);
      if (list != null) {
        listOfInvitations = list;
        invitations = listOfInvitations.items ? listOfInvitations.items : [];
      }

      if (invitations.length == 0) {
        console.log("Store has No Invitations");
      }

      return true;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  async function loadStore(id: string): Promise<Store> {
    try {
      let o: any = await apiStore.get(id);
      const store: Store = new Store(o);
      return store;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  async function loadStoreUser(
    store: string,
    user: string
  ): Promise<StoreUser> {
    try {
      const r: any = await apiStore.users.get(store, user);
      const su: StoreUser = new StoreUser(r);
      return su;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  // Page Initialization //
  async function start(): Promise<boolean> {
    try {
      const id: string = params.store;

      // TODO: Add Spinner
      store = await loadStore(id);
      storeUser = await loadStoreUser(id, user.id());

      // await reloadUsers(id);
      // await reloadInvitations(id);

      return true;
    } catch (e) {
      notify(e.toString());
      return false;
    }
  }

  const unsubscribe = sessionUser.subscribe((u: any) => {
    // Set Current Session User
    user = u;

    // Do we have a Session User?
    if (u != null) {
      // YES: Initialize Page
      start();

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
  });

  // LIFE CYCLE //
  onDestroy(unsubscribe);
</script>

<svelte:head>
  <title>ObjectVault - Store Administration [{params.store}]</title>
</svelte:head>

<Modal
  isOpen={inviteOpen}
  toggle={toggleInvitationModal}
  name="modalCreateInvite"
>
  <ModalHeader toggle={toggleInvitationModal}>Invite User</ModalHeader>
  <ModalBody>
    <Form id="formCreateInvite" class="my-2" on:submit={onSubmitInvitation}>
      <!--
      <div class="d-flex flex-column mx-auto" style="width: 80%;">
        -->
      <InputGroup>
        <InputGroupText>@</InputGroupText>
        <Input
          type="email"
          name="email-invitee"
          id="iInvitee"
          placeholder="email of invitee"
          required
          bind:value={inviteEmail}
        />
      </InputGroup>
      <FormGroup>
        <Label for="iMessage">Message</Label>
        <Input
          type="textarea"
          name="text"
          id="iMessage"
          placeholder="Message to Accompany Invite"
          bind:value={inviteMessage}
        />
        <hr />
        <RolesManager
          labels={{
            x: {
              label: "Permissions in Organization",
            },
          }}
          roles={invitationRolesToManagerList()}
          on:roleModified={onInvitationRolesModification}
        />
        <hr />
      </FormGroup>
      <InputGroup class="d-flex mb-3">
        <InputGroupText id="lPasswordLabel" class="col-4">
          Your Password
        </InputGroupText>
        <Input
          id="iUserPassword"
          type={inviteShowPassword ? "text" : "password"}
          class="col"
          placeholder="Password"
          aria-label="Password"
          aria-describedby="lPasswordLabel"
          required
          invalid={inviteInvalidPassword}
          bind:value={invitePassword}
        />
        <Button
          class="col-auto input-group-text"
          tabindex={-1}
          on:click={onToggleInviteShowPassword}
        >
          <Icon name="eye" />
        </Button>
      </InputGroup>
      <Button type="submit" color="primary" class="w-100">Send</Button>
      <!--
      </div>
      -->
    </Form>
  </ModalBody>
  <ModalFooter>
    <div class="text-danger">Message</div>
  </ModalFooter>
</Modal>

<Modal
  isOpen={rolesModifyModalOpen}
  toggle={toggleRolesModifyModal}
  name="modalEditUserPermissions"
>
  <ModalHeader toggle={toggleRolesModifyModal}
    >{rolesReadOnly ? "Viewing" : "Modifying"}
    {roleModifyEntry.username()} Roles</ModalHeader
  >
  <ModalBody>
    <Form
      id="formEditUserPermissions"
      class="my-2"
      on:submit={onSubmitModifyUserRoles}
    >
      <RolesManager
        labels={{
          x: {
            label: "Permissions in Organization",
          },
        }}
        roles={rolesToModify}
        readOnly={rolesReadOnly}
        on:roleModified={onUserRolesModification}
      />
      {#if !rolesReadOnly}
        <hr />
        <Button type="submit" color="primary" class="w-100">Modify</Button>
      {/if}
    </Form>
  </ModalBody>
  {#if !rolesReadOnly}
    <ModalFooter>
      <div class="text-danger">Message</div>
    </ModalFooter>
  {/if}
</Modal>

<main class="container">
  {#if spinner}
    <Overlay>
      <Spinner />
    </Overlay>
  {/if}

  {#if store}
    <div class="row mb-3">
      <div class="card p-0">
        <h3 class="card-header d-flex">
          <div class="col text-center">Store Administration</div>
          <div class="col-auto">
            <button
              id="saveChanges"
              type="button"
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#modalCreateStore"
            >
              <i class="bi-save" />
              <span class="d-none d-sm-inline">Save</span>
            </button>
            <button
              id="undoChanges"
              type="button"
              class="btn btn-warning"
              data-bs-toggle="modal"
              data-bs-target="#modalCreateStore"
            >
              <i class="bi-arrow-counterclockwise" />
              <span class="d-none d-sm-inline">Reset</span>
            </button>
          </div>
        </h3>
        <div class="card-header">
          <div class="input-group">
            <span id="userLabel" class="col-3 input-group-text">Title</span>
            <input
              id="userID"
              type="text"
              class="col form-control"
              aria-label="User"
              aria-describedby="userLabel"
              required
              value={store.name()}
            />
          </div>
        </div>
      </div>
    </div>
    <div class="row d-flex flex-column flex-sm-row mb-3">
      <SingleFieldExplorer list={sflUsersList} class="col-12 col-sm-6 p-0" />
      <SingleFieldExplorer
        list={sflInvitationsList}
        class="col-12 col-sm-6 p-0"
      />
    </div>
  {:else}
    <h1>Loading</h1>
  {/if}
</main>
