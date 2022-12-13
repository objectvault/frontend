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

  // STORES //
  import sessionUser from "../../stores/session-user";
  import actionsStore from "../../stores/taskbar-actions";
  import notifyStore from "../../stores/notify";

  // Other Libraries //
  import _ from "lodash";

  // WebServices API Library //
  import apiOrg from "../../api/org";
  import apiSession from "../../api/session";
  import apiStore from "../../api/store";
  import apiRoles from "../../api/roles";

  // Developer Libraries //
  import EventEmitter from "../../api/event-emitter";
  import type { User } from "../../classes/user";
  import type { Role, Roles } from "../../classes/roles";
  import { Invitation } from "../../classes/invitation";
  import { Store } from "../../classes/store";
  import { StoreUser } from "../../classes/store-user";
  import type { TAction } from "../../objects/actions";
  import type { TSingleFieldList } from "../../objects/single-field-list";
  import sflUtilities from "../../objects/single-field-list";
  import type { TModelStateList } from "../../objects/state-list";

  // CUSTOM Components //
  import Overlay from "../../components/overlay.svelte";
  import Spinner from "../../components/spinner.svelte";
  import SingleFieldExplorer from "../../components/list-single-field.svelte";
  import TemplateExplorer from "../../components/list-states.svelte";
  import FormInviteToStore from "../../components/forms/form-invite-to-store.svelte";
  import FormStoreUserRoles from "../../components/forms/form-store-user-roles.svelte";
  import ModalForm from "../../components/modal-form.svelte";
  import ModalMessage from "../../components/modal-message.svelte";

  // Component Parameters //
  export let params: any = {}; // IN: Router - Route Parameters

  // COMPONENT Bindable Parameters//
  let spinner: boolean = true;
  let user: User = null; // Session User
  let store: Store = null; // Store Profile
  let storeUser: StoreUser = null; // Registry: Store Session User Registry

  // Message Modal //
  let oModalMessage: any = null;
  let arModalMessages: string[] = [];

  // Invitation Modal Form //
  let inviteOpen: boolean = false;
  let inviteRefresh: any = null; // Invitation Refresh Callback

  const toggleInvitationModal = (refresh = null) => {
    inviteRefresh = refresh;
    inviteOpen = !inviteOpen;
  };

  // User Permissions Modal Form //
  let rolesModifyModalOpen: boolean = false;
  let roleModifyEntry: StoreUser = null;

  const toggleRolesModifyModal = () =>
    (rolesModifyModalOpen = !rolesModifyModalOpen);

  // Template List
  let sflTemplatesList: any = null;

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

  async function onSubmitStoreInvitation(e: CustomEvent) {
    const d: any = e.detail;

    const invitation: any = {
      invitee: d.email.toLowerCase(),
      message: d.message,
      roles: d.roles,
    };

    console.log(`Invite [${d.email}] - Store [${params.store}]`);

    try {
      // Make Sure Session not Expired
      let s: any = apiSession.login(user.id(), d.password, {
        reset: false,
        register: true,
      });

      // Create Store Invite
      let i: any = await apiStore.invites.create(params.store, invitation);

      // Close Modal
      inviteOpen = false;

      // Invitation List Refresh?
      if (inviteRefresh && _.isFunction(inviteRefresh)) {
        await inviteRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function onSubmitModifyUserRoles(e: CustomEvent) {
    const d: any = e.detail;
    const updatedRoles: Roles = d.updateRoles;
    const deletedRoles: Roles = d.deleteRoles;

    // Entry Roles (SOURCE)
    const me: StoreUser = roleModifyEntry;
    const s: Roles = me.roles();
    console.info(s.export());
    if (updatedRoles != null && !updatedRoles.isEmpty()) {
      console.info(updatedRoles.export());
      console.info(deletedRoles.export());

      // Apply Updates
      s.merge(updatedRoles);

      // Remove Deleted Roles
      deletedRoles.forEach((r: Role) => s.del(r.category()));

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

  // HELPERS //
  function notify(n: any) {
    if (notifyPopUp) {
      (notifyPopUp as any)(n);
      return;
    }

    console.log(n);
  }

  function titleModalStoreUserRoles(ou: StoreUser): string {
    const ro: boolean =
      !storeUser
        .roles()
        .hasRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_ROLES,
          apiRoles.FUNCTION_UPDATE
        ) || isSelf(ou.user());
    const username: string = ou.username();
    const mode: string = ro ? "View" : "Modify";
    return `${mode} ${username} Roles`;
  }

  function propsFormStoreUserRoles(ou: StoreUser): any {
    return {
      roles: ou.roles(),
      readOnly:
        !storeUser
          .roles()
          .hasRole(
            apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_ROLES,
            apiRoles.FUNCTION_UPDATE
          ) || isSelf(ou.user()),
    };
  }

  function isSelf(id: string): boolean {
    // TODO: Check if ID Given Matches Session User ID
    return user != null && id == user.id();
  }

  function actionsMessageModal(type: string) {
    switch (type) {
      case "remove-user":
        return [
          {
            id: "__close",
            label: "No",
            color: "success",
            display: () => false,
            handler: (a: TAction) => {
              console.info(`Clicked [${a.id}]`);
              oModalMessage = null;
            },
            tooltip: "Cancel Removal",
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
                // Remove User
                const action: TAction = oModalMessage.params.action;
                const e: StoreUser = oModalMessage.params.entry;
                console.info(`Clicked [${action.id}] on [${e.username()}]`);
                await apiStore.users.delete(e.store(), e.user());

                // User List Refresh?
                const refresh: any = _.get(action, "__reloadList", null);
                if (refresh && _.isFunction(refresh)) {
                  await refresh();
                }

                console.log(
                  `User [${e.username()}] DELETED from Store [${store.name()}]`
                );

                // Hide Modal
                oModalMessage = null;
              } catch (e) {
                console.error(e);
                arModalMessages = [e.toString()];
              }
            },
            tooltip: "Remove User",
          },
        ];
      case "remove-invite":
        return [
          {
            id: "__close",
            label: "No",
            color: "success",
            display: () => false,
            handler: (a: TAction) => {
              console.info(`Clicked [${a.id}]`);
              oModalMessage = null;
            },
            tooltip: "Cancel Removal",
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
                // Remove User
                const action: TAction = oModalMessage.params.action;
                const e: Invitation = oModalMessage.params.entry;
                console.info(`Clicked [${action.id}] on [${e.invitee()}]`);
                await apiStore.invites.delete(e.id());

                // User List Refresh?
                const refresh: any = _.get(action, "__reloadList", null);
                if (refresh && _.isFunction(refresh)) {
                  await refresh();
                }

                console.log(
                  `Invitation [${e.uid()}] DELETED from Store [${store.name()}]`
                );

                // Hide Modal
                oModalMessage = null;
              } catch (e) {
                console.error(e);
                arModalMessages = [e.toString()];
              }
            },
            tooltip: "Remove Invitation",
          },
        ];
    }
  }

  // START: SINGLE FIELD LIST - Users //
  function entryActionsUsersList(entry: StoreUser): TAction[] {
    /* CONDITIONS:
     * IS SELF : Read Only (Can't Edit)
     * IS Not Self : Depends on Permissions
     */
    const self: boolean = isSelf(entry.user());

    return [
      {
        id: "user.permissions",
        icon: "unlock-fill",
        color: "primary",
        handler: (a: TAction, e: StoreUser) => {
          console.info(`Clicked [${a.id}] on [${e.username()}]`);
          roleModifyEntry = e;
          toggleRolesModifyModal();
        },
        label: "Roles",
        tooltip: self ? "View My Permissions" : "Modify User Permissions",
        display: (a: TAction, e: StoreUser) =>
          storeUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_ROLES,
              apiRoles.FUNCTION_READ
            ) && e.roles() != null,
      },
      {
        id: "user.delete",
        icon: "trash",
        color: "danger",
        handler: async (a: TAction, e: StoreUser) => {
          oModalMessage = {
            title: "Remove User",
            message: `Remove user [${e.username()}] from Store?`,
            type: "remove-user",
            params: {
              action: a,
              entry: e,
            },
          };
        },
        display: (a: TAction, e: StoreUser) =>
          storeUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_USER,
              apiRoles.FUNCTION_DELETE
            ) && !storeUser.isUser(e.user()),
        label: "Delete",
        tooltip: "Remove User from Store",
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
  // END: SINGLE FIELD LIST - Users //

  // START: SINGLE FIELD LIST - Invitations //
  function entryActionsInvitationsList(entry: any): TAction[] {
    return [
      {
        id: "invite.resend",
        icon: "arrow-clockwise",
        color: "info",
        handler: async (a: TAction, i: Invitation) => {
          console.info(`Clicked [${a.id}] on [${i.invitee()}]`);
          try {
            const r: any = await apiStore.invites.resend(i.id());
            console.log(r);
          } catch (e) {
            console.error(e);
          }
        },
        label: "Resend",
        tooltip: "Resend Invitation",
      },
      {
        id: "invite.delete",
        icon: "trash",
        color: "danger",
        handler: async (a: TAction, i: Invitation) => {
          oModalMessage = {
            title: "Delete Invitation",
            message: `Delete Store Invitation for [${i.invitee()}]?`,
            type: "remove-invite",
            params: {
              action: a,
              entry: i,
            },
          };
        },
        display: (a: TAction, i: Invitation) =>
          storeUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_INVITE,
              apiRoles.FUNCTION_DELETE
            ),
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
      let list: any = null;
      if (fv.length) {
        const filter: string = `contains(invitee, "${fv}")`;
        list = await apiStore.invites.list(store, { filter });
      } else {
        list = await apiStore.invites.list(store);
      }

      // Map List Items
      list.items = list.items.map((i: any) => new Invitation(i));

      return list;
    };
    return l;
  }
  // END: SINGLE FIELD LIST - Invitations //

  // START: SINGLE FIELD LIST - Templates //
  async function templateListLoader(l: TModelStateList): Promise<any> {
    const fv: string = l.filter.get();
    const filter: string = fv.length ? `contains(name, "${fv}")` : null;

    // CURRENTLY: Assume Child List CAN NOT contain entries that are not in the parent list
    // Parent List
    const plist: any = await apiOrg.templates.list(store.organization(), {
      filter,
    });

    // Child List
    const clist: any = await apiStore.templates.list(store.id(), { filter });

    // Display Template State
    l.displayState = true;

    // Get Internal Representation
    const _internal: any = l._internal;

    // Save Pager from Parent List
    _internal.pager = plist.pager;
    _internal.query = plist.query;

    // RESET Internal Representation
    _internal.parentObject = store.organization();
    _internal.childObject = store.id();
    _internal.entryIDs = [];
    _internal.entries = {};

    // Do we have Templates?
    if (plist.items.length) {
      // Adapt WS Parent List to View List
      let template: string;
      for (const item of plist.items) {
        template = (item as any).name;
        _internal.entryIDs.push(template);
        (item as any).state = 0; // Exists in Parent
        _internal.entries[template] = item;
      }

      if (clist) {
        // Merge Child List
        for (const item of clist.items) {
          template = (item as any).name;
          if (_internal.entries.hasOwnProperty(template)) {
            _internal.entries[template].state = 1; // Exists in Both Parent and Child
          }
        }
      }
    }

    return l;
  }

  function createTemplatesList(): TModelStateList {
    // Create Basic SFL Object
    const l: TModelStateList = {
      header: {
        title: "Templates",
      },
      filter: sflUtilities.standardFilterObject(
        "name",
        null,
        "Filter by Template"
      ),
      entries: null,
      entryID: null,
      entryLabel: null,
      displayState: false,
      entryState: null,
      changeNextState: null,
      entryIcon: (id: any): string => "card-checklist",
      stateIcon: null,
      loader: null,
      // List Internal Representation
      _internal: {
        parentObject: null,
        childObject: null,
        entryIDs: [],
        entries: {},
      },
    };

    l.entries = () => l._internal.entryIDs;
    l.entryID = (id: any): string => id;
    l.entryLabel = (id: any): string => {
      const entries: any = l._internal.entries;
      return _.get(entries, `${id}.title`, "?Missing?");
    };
    l.entryState = (id: any): any => {
      const entries: any = l._internal.entries;
      return _.get(entries, `${id}.state`, -1);
    };
    l.changeNextState = async (id: any): Promise<any> => {
      const entries: any = l._internal.entries;
      const current: number = l.entryState(id);
      switch (current) {
        case 0: // Not in Organization
          console.info(`Template [${id}] not in Organization`);
          await apiStore.templates.add(l._internal.childObject, id);
          _.set(entries, `${id}.state`, 1);
          break;
        case 1: // In Organization
          console.info(`Template [${id}] in Organization`);
          await apiStore.templates.delete(l._internal.childObject, id);
          _.set(entries, `${id}.state`, 0);
          break;
        default:
          console.error(`Template [${id}] in unknown state [${current}]`);
      }
    };

    l.stateIcon = (s: any): string => {
      switch (s as number) {
        case 0:
          return "square";
        case 1:
          return "check-square";
        default:
          return "question-square";
      }
    };

    // Create Loader
    l.loader = (): Promise<any> => templateListLoader(l);
    return l;
  }
  // END: SINGLE FIELD LIST - Templates //

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

      // Has Access to Template List?
      if (
        storeUser &&
        storeUser
          .roles()
          .hasRole(
            apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_TEMPLATE,
            apiRoles.FUNCTION_LIST
          )
      ) {
        // Display Template List
        sflTemplatesList = createTemplatesList();
      }

      spinner = false;
      return true;
    } catch (e) {
      setTimeout(() => (spinner = false), 1000);
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

{#if oModalMessage !== null}
  <ModalMessage
    isOpen={true}
    title={oModalMessage.title}
    message={oModalMessage.message}
    actions={actionsMessageModal(oModalMessage.type)}
    messages={arModalMessages}
    centered={true}
  />
{/if}

<ModalForm
  form={FormInviteToStore}
  isOpen={inviteOpen}
  toggle={toggleInvitationModal}
  name="modalInviteToOrg"
  title="Invite User"
  on:formSubmit={onSubmitStoreInvitation}
/>

{#if roleModifyEntry}
  <ModalForm
    form={FormStoreUserRoles}
    isOpen={rolesModifyModalOpen}
    toggle={toggleRolesModifyModal}
    name="modalStoreUserRoles"
    title={titleModalStoreUserRoles(roleModifyEntry)}
    on:formSubmit={onSubmitModifyUserRoles}
    formProps={propsFormStoreUserRoles(roleModifyEntry)}
  />
{/if}

<main class="container">
  {#if spinner}
    <Overlay>
      <Spinner />
    </Overlay>
  {/if}

  {#if store && storeUser}
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
      {#if storeUser
        .roles()
        .hasRole(apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_USER, apiRoles.FUNCTION_LIST)}
        <SingleFieldExplorer list={sflUsersList} class="col-12 col-sm-6 p-0" />
      {/if}
      {#if storeUser
        .roles()
        .hasRole(apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_INVITE, apiRoles.FUNCTION_LIST)}
        <SingleFieldExplorer
          list={sflInvitationsList}
          class="col-12 col-sm-6 p-0"
        />
      {/if}
    </div>
    {#if sflTemplatesList && storeUser
        .roles()
        .hasRole(apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_TEMPLATE, apiRoles.FUNCTION_LIST)}
      <div class="row mb-3">
        <TemplateExplorer list={sflTemplatesList} class="px-0" />
      </div>
    {/if}
  {/if}
</main>
