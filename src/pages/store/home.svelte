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

  /* START.CHECKS */
  import du from "../../dev-utils";
  /* END.CHECKS */

  // SVELTE API //
  import { onDestroy, tick } from "svelte";

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

  // Other Libraries
  import _ from "lodash";

  // STORES //
  import sessionUser from "../../stores/session-user";
  import actionsStore from "../../stores/taskbar-actions";
  import notifyStore from "../../stores/notify";

  // WebServices API Library //
  import apiStore from "../../api/store";
  import apiStoreUser from "../../api/store/store-user";
  import apiRoles from "../../api/roles";

  // Developer Libraries //
  import EventEmitter from "../../api/event-emitter";
  import { Store } from "../../classes/store";
  import { StoreUser } from "../../classes/store-user";
  import { StoreObject } from "../../classes/store-object";
  import { TemplateObjectAdaptor } from "../../classes/template-object-adapter";
  import type { FormTemplate } from "../../classes/form-template";
  import type { User } from "../../classes/user";
  import type { TAction } from "../../objects/actions";
  import type { TSingleFieldList } from "../../objects/single-field-list";
  import sflUtilities from "../../objects/single-field-list";

  // CUSTOM Components //
  import Overlay from "../../components/overlay.svelte";
  import Spinner from "../../components/spinner.svelte";
  import SingleFieldExplorer from "../../components/list-single-field.svelte";
  import ObjectEditor from "../../components/store/object/editor.svelte";

  // Component Paramters //
  export let params: any = {}; // IN: Router - Route Parameters

  // COMPONENT Bindable Paramters//
  let spinner: boolean = true;
  let store: Store = null; // Store Profile
  let storeUser: StoreUser = null; // Registry: Store Session User Registry
  let user: User = null;
  let listOftemplates: string[] = []; // List of Templates in Store Returned from API
  let templates: any[] = []; // List of Templates in Store

  // Store Open Dialog //
  let displayStoreLogin: boolean = false;
  const toggleStoreOpenModal = () => {
    displayStoreLogin = !displayStoreLogin;
  };

  // PROPERTIES: Store Open Form //
  let sUser: string = "";
  let bInvalidUser: boolean = true;
  let sUserPassword: string = "";
  let bInvalidPassword: boolean = true;
  let bActiveEye: boolean = false;
  let arMessagesLoginForm: string[] = [];
  let displayObjectList: boolean = false;

  const toggleShowPassword = (e: Event) => {
    e.preventDefault(); // NEEDED: Clicking on Button Closes Dialog
    bActiveEye = !bActiveEye;
  };

  // Object Editor //
  let displayObjectEditor: boolean = false;
  let modeObjectEditor: string = "read";
  let editorObject: StoreObject = null;

  // Object Properties //
  let currentTemplate: FormTemplate = null;
  let object: TemplateObjectAdaptor = new TemplateObjectAdaptor();

  // Delete Confirmation Dialog //
  let displayDeleteModal: boolean = false;
  let deleteObject: StoreObject = null;
  let deleteMessage: string = null;
  const toggleDeleteModal = () => {
    displayDeleteModal = !displayDeleteModal;
  };

  // Pending Transactions //
  let pending: any[] = [];

  // Reactive Stores //
  $: notifyPopUp = $notifyStore;

  // Reactive Statements //
  $: sflObjectsList = createObjectsList(params.store);

  // DEBUG //
  $: console.log(params);

  // EVENTS //
  function onClickLogout(a: TAction) {
    EventEmitter.emit("do-logout");
  }

  async function onOpenStore(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    // Set Form Login Messages if Any
    arMessagesLoginForm = validateStoreOpenForm();

    // Get Current User
    sUser = sUser.trim();

    // We have Valid Information?
    if (arMessagesLoginForm.length === 0) {
      try {
        const u: any = await apiStore.session.open(
          store.organization(),
          store.id(),
          sUserPassword
        );

        // Close Dialog
        displayStoreLogin = false;

        // Flush any Pending Requests
        flushPending();
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

  async function onCancelDeleteObject(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    // Clear any Pending Requests
    clearPending();

    // Display Confirmation Modal
    deleteObject = null;
    displayDeleteModal = false;
  }

  async function onDeleteObject(e: PointerEvent) {
    // Stop Further Processing
    e.preventDefault();

    // Hide  Confirmation Modal
    displayDeleteModal = false;

    try {
      console.info(`Deleting object [${deleteObject.title()}]`);

      const callback = async () => {
        const r: boolean = await deleteObject.wsDelete();
        /*
        const r: any = await apiStore.objects.delete(
          deleteObject.store(),
          deleteObject.id()
        );
        */
        console.info(r);
        deleteObject = null;

        // Call List Reloader
        sflUtilities.callReloader(sflObjectsList);
      };

      openStoreForAction(callback);
    } catch (e) {
      // handle error
      notify(e.toString());
      console.log(e);
    }
  }

  async function onObjectEditorAction(e: CustomEvent) {
    const d: any = e.detail;

    try {
      let o: StoreObject = d.object;
      let callback: any = null;

      switch (d.action) {
        case "error":
          if (d.mount) {
            // Wait for Next Rendering loop
            // so that display of model has time to complete before we try to destroy it
            await tick();
          }

          throw d.message;
        case "close":
        case "cancel":
          break;
        case "create":
          // Flush Update if Store Open
          callback = async () => {
            await o.wsCreate(store.id());

            displayObjectEditor = false;
            editorObject = null;
          };

          break;
        case "update":
          // Flush Update if Store Open
          callback = async () => {
            await o.wsUpdate();

            displayObjectEditor = false;
            editorObject = null;
          };
          break;
      }

      if (callback) {
        openStoreForAction(callback);
      } else {
        displayObjectEditor = false;
        editorObject = null;
      }
    } catch (e) {
      displayObjectEditor = false;
      editorObject = null;
      notify(e.toString());
    }
  }

  // ACTION HANDLERS //
  function onHandleObjectCreate(a: TAction) {
    console.info(`Clicked [${a.id}]`);

    // Display Object Create Modal
    modeObjectEditor = "create";
    displayObjectEditor = true;
  }

  async function onHandleObjectView(o: StoreObject) {
    try {
      console.info(`Clicked [View Object] on [${o.title()}]`);
      // Object Create Function
      const callback: any = async () => {
        // Has the object been loaded?
        if (!o.isLoaded()) {
          // NO: Load it
          await o.wsRefresh(true);
        }

        editorObject = o;

        // Display Object View Modal
        modeObjectEditor = "read";
        displayObjectEditor = true;
      };

      openStoreForAction(callback);
    } catch (e) {
      // handle error
      notify(e.toString());
      console.log(e);
    }
  }

  async function onHandleObjectUpdate(o: StoreObject) {
    try {
      console.info(`Clicked [Update Object] on [${o.title()}]`);
      // Object Create Function
      const callback: any = async () => {
        // Has the object been loaded?
        if (!o.isLoaded()) {
          // NO: Load it
          await o.wsRefresh(true);
        }

        // Set Object to Update
        editorObject = o;

        // Display Object Update Modal
        modeObjectEditor = "update";
        displayObjectEditor = true;
      };

      openStoreForAction(callback);
    } catch (e) {
      // handle error
      notify(e.toString());
      console.log(e);
    }
  }

  async function onHandleObjectDelete(o: StoreObject) {
    // Set Object to Delete
    deleteObject = o;

    // Display Confirmation Modal
    deleteMessage = `Do you really want to delete [${o.title()}]?`;
    displayDeleteModal = true;
  }

  // HELPERS //
  function clearPending() {
    // Clear Pending
    pending = [];
  }

  async function flushPending() {
    // Loop through Pending Running Requests
    pending.forEach(async (request: any) => {
      try {
        await request();
      } catch (e) {
        notify(e.toString());
      }
    });

    // Clear Pending
    pending = [];
  }

  async function openStoreForAction(callback: any) {
    /* START.CHECKS */
    !_.isFunction(callback) && du.throwMessage("Missing Callback");
    /* END.CHECKS */

    // Clear any Pending Requests
    clearPending();

    // Is Store Open?
    const b: boolean = await apiStore.session.isOpen(store.id());
    if (b === false) {
      // NO: Open with Pending Request
      pending.push(callback);
      displayStoreLogin = true;
    } else {
      callback();
    }
  }

  function notify(n: any) {
    if (notifyPopUp) {
      (notifyPopUp as any)(n);
      return;
    }

    console.log(n);
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

  function validateStoreOpenForm(): string[] {
    const arPasswordMessages: string[] = validateLoginPassword();

    bInvalidPassword = arPasswordMessages.length > 0;
    return [...arPasswordMessages];
  }

  async function loadStore(id: string): Promise<Store> {
    let o: any = await apiStore.get(id);
    const store: Store = new Store(o);
    return store;
  }

  async function loadStoreUser(
    store: string,
    user: string
  ): Promise<StoreUser> {
    const r: any = await apiStoreUser.get(store, user);
    const su: StoreUser = new StoreUser(r);
    return su;
  }

  async function reloadTemplates(id: string): Promise<any> {
    try {
      // Reload Templates List
      // TODO: Have to add Filter Option SVELTE Control or else if list grows bigger than 100 items, it will be cut off
      const list: any = await apiStore.templates.list(id);
      if (list != null) {
        templates = list.items ? list.items : [];
      }

      if (templates.length == 0) {
        console.log("Store has No Templates");
      }

      return list;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  function createObjectsList(store: string): TSingleFieldList {
    // Create Basic SFL Object
    const l: TSingleFieldList = {
      header: {
        title: "Objects",
      },
      listActions: listActionsObjectsList,
      filter: sflUtilities.standardFilterObject(
        "title",
        null,
        "Filter by Title"
      ),
      entry: sflUtilities.standardEntryObject(
        "object",
        "title",
        "sd-card-fill"
      ),
      entryActions: entryActionsObjectsList,
      loader: null,
      reloader: null,
    };

    // Set Filter Normalization Function
    l.filter.normalize = (v: string) => v.trim();

    // Create Loader
    l.loader = async (): Promise<any> => {
      try {
        let fv: string = l.filter.get();
        let list: any = null;

        if (fv.length) {
          const filter: string = `contains(title, "${fv}")`;
          list = await apiStore.objects.list(store, ":0", { filter });
        } else {
          list = await apiStore.objects.list(store, ":0");
        }

        // Map List Items
        list.items = list.items.map((i: any) => new StoreObject(i));
        return list;
      } catch (e) {
        notify(e.toString());
        return null;
      }
    };
    return l;
  }

  function listActionsObjectsList(): TAction[] {
    return [
      {
        id: "object.create",
        icon: "plus-square",
        color: "primary",
        handler: onHandleObjectCreate,
        display: () =>
          storeUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_OBJECT,
              apiRoles.FUNCTION_CREATE
            ),
        label: "Create",
        tooltip: "Create Object",
      },
    ];
  }

  function entryActionsObjectsList(o: StoreObject): TAction[] {
    return [
      {
        id: "object.view",
        icon: "eye",
        color: "primary",
        handler: (a: TAction) => onHandleObjectView(o),
        display: () =>
          storeUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_OBJECT,
              apiRoles.FUNCTION_READ
            ),
        label: "Roles",
        tooltip: "View Object",
      },
      {
        id: "object.update",
        icon: "pencil",
        color: "warning",
        handler: (a: TAction) => onHandleObjectUpdate(o),
        display: () =>
          storeUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_OBJECT,
              apiRoles.FUNCTION_UPDATE
            ),
        label: "modify",
        tooltip: "Modify Object",
      },
      {
        id: "object.delete",
        icon: "trash",
        color: "danger",
        handler: (a: TAction) => onHandleObjectDelete(o),
        display: () =>
          storeUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_OBJECT,
              apiRoles.FUNCTION_DELETE
            ),
        label: "Delete",
        tooltip: "Delete Object",
      },
    ];
  }

  // Page Initialization //
  async function start(): Promise<boolean> {
    console.log("start: store\\home.svelte");

    try {
      const id: string = params.store;

      // TODO: Add Spinner
      store = await loadStore(id);
      storeUser = await loadStoreUser(id, user.id());

      // Can User List Objects?
      if (
        storeUser &&
        storeUser
          .roles()
          .hasRole(
            apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_OBJECT,
            apiRoles.FUNCTION_LIST
          )
      ) {
        // YES: Load Objects
        displayObjectList = true;
      }

      // Load List of Store Templates
      listOftemplates = await reloadTemplates(id);
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
  <title>ObjectVault - Store [{params.store}]</title>
</svelte:head>

<Modal
  isOpen={displayStoreLogin}
  toggle={toggleStoreOpenModal}
  centered={true}
  header="Open Store"
>
  <ModalBody>
    <form id="formLogin" class="my-2 needs-validation" novalidate>
      <div class="d-flex flex-column mx-auto" style="width: 80%;">
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
            on:click={toggleShowPassword}
          >
            <Icon name="eye" />
          </Button>
        </InputGroup>
        <Button type="submit" color="primary" on:click={onOpenStore}>
          Open
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

{#if store && displayObjectEditor}
  <ObjectEditor
    mode={modeObjectEditor}
    {store}
    object={editorObject}
    on:onHandleAction={onObjectEditorAction}
  />
{/if}

<Modal
  isOpen={displayDeleteModal}
  toggle={toggleDeleteModal}
  centered={true}
  header="Delete Object"
>
  <ModalBody>
    <div class="d-flex flex-column mx-auto" style="width: 80%;">
      <div class="row mb-3">
        <h4 class="col">{deleteMessage}</h4>
      </div>
      <div class="row d-flex justify-content-between">
        <Button
          type="submit"
          color="success"
          class="col-4"
          on:click={onCancelDeleteObject}
        >
          NO
        </Button>
        <Button
          type="submit"
          color="danger"
          class="col-4"
          on:click={onDeleteObject}
        >
          YES
        </Button>
      </div>
    </div>
  </ModalBody>
</Modal>

<main class="container">
  {#if spinner}
    <Overlay>
      <Spinner />
    </Overlay>
  {/if}

  {#if user && store}
    <div class="card mb-3">
      <h3 class="card-header d-flex">
        <div class="col">{store.alias()}</div>
        <div name="actions" class="col-auto">
          {#if (store.state() & 0xfff) == 0}
            <a
              id="editStore"
              href="#/admin/store/{params.store}"
              class="btn btn-warning"
              role="button"
            >
              <i class="bi-pencil" />
              <span class="d-none d-md-inline">Edit</span>
            </a>
          {/if}
        </div>
      </h3>
      <div class="card-body">{store.name() ? store.name() : ""}</div>
    </div>
    {#if storeUser && displayObjectList}
      <SingleFieldExplorer list={sflObjectsList} />
    {/if}
  {/if}
</main>
