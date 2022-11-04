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
  import apiOrg from "../../api/org";
  import apiOrgUser from "../../api/org/org-user";
  import apiRoles from "../../api/roles";
  import apiSystem from "../../api/system";

  // Developer Libraries //
  import utilities from "../../api/utilities";
  import EventEmitter from "../../api/event-emitter";
  import type { User } from "../../classes/user";
  import { Role, Roles } from "../../classes/roles";
  import { Organization } from "../../classes/organization";
  import { OrganizationUser } from "../../classes/organization-user";
  import type { TAction } from "../../objects/actions";
  import type { TSingleFieldList } from "../../objects/single-field-list";
  import sflUtilities from "../../objects/single-field-list";
  import type { TModelStateList } from "../../objects/state-list";

  // CUSTOM Components //
  import Overlay from "../../components/overlay.svelte";
  import Spinner from "../../components/spinner.svelte";
  import SingleFieldExplorer from "../../components/list-single-field.svelte";
  import TemplateExplorer from "../../components/list-states.svelte";
  import RolesManager from "../../components/roles-manager.svelte";
  import FormCreateOrg from "../../components/forms/form-create-org.svelte";
  import FormCreateStore from "../../components/forms/form-create-store.svelte";
  import ModalForm from "../../components/modal-form.svelte";
  //  import COrganization from "../admin/organization.svelte";

  // Component Paramters //
  export let params: any = {}; // IN: Router - Route Parameters

  // Component Variables //
  let spinner: boolean = false;
  let user: User = null; // Session User
  let organization: Organization = null; // Organization Object
  let organizationUser: OrganizationUser = null; // Registry: Organization Session User Registry
  let listOfStores: any = null; // List of Stores Object Returned from API
  let stores: any[] = []; // Stores Array
  let listAllOrgs: any = null; // List of All Systems Organizations Returned from API
  let allOrgs: any[] = []; // Organizations Array
  let listAllUsers: any = null; // List of All System Users Returned from API
  let allUsers: any[] = []; // Users Array

  // Invitation Modal Form //
  let inviteOpen: boolean = false;
  let inviteEmail: string = "";
  let inviteMessage: string = "";
  let inviteRefresh: any = null; // Invitation Refresh Callback
  let inviteRoles: Roles = new Roles("33882113,33947651");
  // NOTE: Organization READ Role (33882113) is RFEQUIRED and HIDDEN in invitation

  const toggleInvitationModal = (refresh = null) => {
    inviteRefresh = refresh;
    inviteOpen = !inviteOpen;
  };

  // User Permissions Modal Form //
  let rolesModifyModalOpen: boolean = false;
  let roleModifyEntry: OrganizationUser = null;
  let rolesReadOnly: boolean = false;
  let rolesToModify: any = null;
  let updatedRoles: Roles = null;

  const toggleRolesModifyModal = () =>
    (rolesModifyModalOpen = !rolesModifyModalOpen);

  // Store Create Modal Form //
  let storeOpen: boolean = false;
  let storeMessages: string[] = [];
  const toggleStoreModal = () => (storeOpen = !storeOpen);

  // Organization Create Modal Form //
  let orgOpen: boolean = false;
  let orgMessages: string[] = [];
  const toggleOrgModal = () => (orgOpen = !orgOpen);

  // Template List
  let sflTemplatesList: any = null;

  // Reactive Stores //
  $: notifyPopUp = $notifyStore;

  // Reactive Statements //
  $: sflUsersList = createUsersList(params.org);
  $: sflInvitationsList = createInvitationsList(params.org);

  // DEBUG //
  $: console.log(params);

  // EVENTS //
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
    };

    let constraints = {
      invitee: {
        presence: { allowEmpty: false },
        email: true,
      },
      message: {
        presence: { allowEmpty: true },
      },
    };

    const r: any = validate(invitation, constraints);
    if (r) {
      console.info(r.invitee[0]);
      return;
    }

    try {
      let i: any = await apiOrg.invites.create(params.org, invitation);
      if (inviteRefresh && _.isFunction(inviteRefresh)) {
        await inviteRefresh();
      }
      toggleInvitationModal();
    } catch (e) {
      notify(e);
    }
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

  async function onSubmitModifyUserRoles(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Entry Roles (SOURCE)
    const me: OrganizationUser = roleModifyEntry;
    const s: Roles = me.roles();
    console.info(s.export());
    if (updatedRoles != null) {
      console.info(updatedRoles.export());
      s.merge(updatedRoles);
      console.info(s.export());

      try {
        let m: any = await apiOrgUser.roles.set(
          me.organization(),
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

  async function onSubmitStoreCreate(e: CustomEvent) {
    const d: any = e.detail;
    console.log(`Store [${d.alias}] - [${d.title}]`);

    const store: any = {
      alias: d.alias.toLocaleLowerCase(),
      title: d.title,
      password: d.password,
    };

    try {
      // Hash User Password
      store.credentials = utilities.hash.calculate(store.password);
      delete store.password;

      let s: any = await apiOrg.stores.create(params.org, store);
      await reloadStores(params.org);

      // Close Modal
      storeOpen = false;
      console.info(s);
    } catch (e) {
      storeMessages.push(e.toString());
      console.error(e);
    }
  }

  async function onSubmitOrgCreate(e: CustomEvent) {
    const d: any = e.detail;
    console.log(`Organization [${d.alias}] - [${d.title}]`);

    const org: any = {
      alias: d.alias.toLocaleLowerCase(),
      title: d.title,
    };

    try {
      let o: any = await apiSystem.orgs.create(org);
      await reloadAllOrgs();

      // Close Modal
      orgOpen = false;
      console.info(o);
    } catch (e) {
      orgMessages.push(e.toString());
      console.error(e);
    }
  }

  function onClickLogout(a: TAction) {
    EventEmitter.emit("do-logout");
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
    return organizationUser != null && id == organizationUser.user();
  }

  function isOrganizationAdmin(): boolean {
    return organizationUser != null && organizationUser.isAdmin();
  }

  function extractPermissions(
    category: number,
    perms: number[],
    d?: number
  ): number {
    let v: number = d == null ? category : d;
    for (const p of perms) {
      if ((p & 0xffff0000) === category) {
        v = p;
      }
    }

    return v;
  }

  function invitationRolesToManagerList(): any {
    if (organization.isSystem()) {
      return {
        Functions: [
          {
            id: "org",
            label: "Org",
            icon: "building",
            value: 0x02050003,
            fixed: 0x0003,
          },
        ],
      };
    } else {
      return {
        Functions: [
          {
            id: "store",
            label: "Store",
            icon: "sd-card",
            value: 0x02060003,
            fixed: 0x0003,
          },
        ],
      };
    }
  }

  function csvRolesToManagerList(r: Roles): any {
    // ORGANIZATION 0 //
    // NON ADMIN: CAN'T MODIFY ROLES (HAS TO BE ADMIN)
    // ADMIN : HAS TO HAVE ROLES MODIFICATION RIGHTS //
    // ADMIN : SELF
    // 1 - CAN'T MODIFY ROLES
    // 2 - CAN ONLY SEE ROLES IF HAS LIST ROLES PERMISSION

    // ORGANIZATION != 0 //
    // NON ADMIN: CAN'T MODIFY ROLES (HAS TO BE ADMIN)
    // ADMIN : HAS TO HAVE ROLES MODIFICATION RIGHTS //
    // ADMIN : SELF
    // 1 - CAN'T MODIFY ROLES
    // 2 - CAN ONLY SEE ROLES IF HAS LIST ROLES PERMISSION

    // ORGANIZATION 0 : ROLES //
    // SYSTEM ROLES : CROSS ORGANIZATION (ONLY: NO STORE PERMISSIONS) //
    // apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_CONF   (ALL - SERVER CONFIGURATION)
    // apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_USER   (ALL - SYSTEM LEVEL)
    // apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_ROLES  (ALL - ORGANIZATION LEVEL, EXCEPT 0))
    // apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_INVITE (READ | LIST | DELETE ONLY : ORGANIZATION LEVEL EXCEPT 0)
    // apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_ORG    (ALL - ALL, EXCEPT 0)
    // NORMAL ROLES :
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_CONF   (ALL - ORGANIZATION CONFIGURATION)
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_USER   (ALL)
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_ROLES  (ALL)
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_INVITE (ALL)
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_ORG    (ALL)

    // ORGANIZATION !0 : ROLES //
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_CONF   (ALL - ORGANIZATION CONFIGURATION)
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_USER   (ALL )
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_ROLES  (ALL)
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_INVITE (ALL)
    // apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_STORE  (ALL)

    // Current Roles
    const roles: number[] = apiRoles.CSVToRoles(r.export());
    const system_roles: any[] = [
      {
        id: "conf",
        label: "Settings",
        icon: "gear-fill",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_CONF,
          roles
        ),
      },
      {
        id: "user",
        label: "User",
        icon: "person",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_USER,
          roles
        ),
      },
      {
        id: "roles",
        label: "Roles",
        icon: "lock",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_SYSTEM | apiRoles.SUBCATEGORY_ROLES,
          roles
        ),
      },
    ];

    const org_0_roles: any[] = [
      {
        id: "conf",
        label: "Settings",
        icon: "gear-fill",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_CONF,
          roles
        ),
      },
      {
        id: "user",
        label: "User",
        icon: "person",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_USER,
          roles
        ),
      },
      {
        id: "roles",
        label: "Roles",
        icon: "lock",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_ROLES,
          roles
        ),
      },
      {
        id: "invite",
        label: "Invites",
        icon: "envelope",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_INVITE,
          roles
        ),
      },
      {
        id: "org",
        label: "Orgs",
        icon: "building",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_ORG,
          roles
        ),
      },
      {
        id: "templates",
        label: "Templates",
        icon: "file-text",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_TEMPLATE,
          roles
        ),
        fixed: apiRoles.FUNCTION_UPDATE,
      },
    ];

    const org_not_0_roles: any[] = [
      {
        id: "conf",
        label: "Settings",
        icon: "gear-fill",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_CONF,
          roles
        ),
      },
      {
        id: "user",
        label: "User",
        icon: "person",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_USER,
          roles
        ),
      },
      {
        id: "roles",
        label: "Roles",
        icon: "lock",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_ROLES,
          roles
        ),
      },
      {
        id: "invite",
        label: "Invites",
        icon: "envelope",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_INVITE,
          roles
        ),
      },
      {
        id: "org",
        label: "Org",
        icon: "building",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_ORG,
          roles
        ),
      },
      {
        id: "store",
        label: "Store",
        icon: "sd-card",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_STORE,
          roles
        ),
      },
      {
        id: "templates",
        label: "Templates",
        icon: "file-text",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_TEMPLATE,
          roles
        ),
        fixed: apiRoles.FUNCTION_UPDATE,
      },
    ];

    const roles_list: any = {};
    if (organization.isSystem()) {
      if (organizationUser.isAdmin()) {
        roles_list["System Functions"] = system_roles;
      }
      roles_list["Organization Functions"] = org_0_roles;
    } else {
      roles_list["Organization Functions"] = org_not_0_roles;
    }

    return roles_list;
  }

  function hasPageUp(l: any) {
    if (l != null && typeof l.pager == "object") {
      const p: any = l.pager;
      return p.offset > 0;
    }

    return false;
  }

  function hasPageDown(l: any) {
    if (l != null && typeof l.pager == "object") {
      const p: any = l.pager;
      const last: number = p.offset + p.count;
      return last < p.countAll;
    }

    return false;
  }

  function entryActionsUsersList(entry: any): TAction[] {
    /* CONDITIONS:
     * IS SELF : Read Only (Can't Edit)
     * IS Not Self : Depends on Permissions
     */
    const self: boolean = isSelf(entry.user());
    const isOrgAdmin: boolean = isOrganizationAdmin();

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
        tooltip: "Remove User from Organization",
      },
      {
        id: "admin.toggle",
        icon: isOrgAdmin ? "star-fill" : "star",
        color: isOrgAdmin ? "warning" : "danger",
        handler: (a: TAction) =>
          console.info(`Clicked [${a.id}] on [${entry.username()}]`),
        disabled: () => self,
        label: "Admin",
        tooltip: isOrgAdmin ? "Remove Admin Status" : "Make Admin",
      },
    ];
  }

  function createUsersList(org: string): TSingleFieldList {
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
        list = await apiOrg.users.list(org, { filter });
      } else {
        list = await apiOrg.users.list(org);
      }

      // Map List Items
      list.items = list.items.map((i: any) => new OrganizationUser(i));

      return list;
    };
    return l;
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

  function entryActionsInvitationsList(entry: any): TAction[] {
    return [
      {
        id: "invite.resend",
        icon: "arrow-clockwise",
        color: "info",
        handler: async (a: TAction, entry: any) => {
          console.info(`Clicked [${a.id}] on [${entry.invitee}]`);
          try {
            const i: any = await apiOrg.invites.resend(entry.id);
            console.log(i);
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
        handler: (a: TAction, entry: any) =>
          console.info(`Clicked [${a.id}] on [${entry.invitee}]`),
        label: "Delete",
        tooltip: "Delete Invitation",
      },
    ];
  }

  function createInvitationsList(org: string): TSingleFieldList {
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
        return apiOrg.invites.list(org, { filter });
      } else {
        return apiOrg.invites.list(org);
      }
    };
    return l;
  }

  async function templateListLoader(l: TModelStateList): Promise<any> {
    const fv: string = l.filter.get();
    const filter: string = fv.length ? `contains(name, "${fv}")` : null;

    // CURRENTLY: Assume Child List CAN NOT contain entries that are not in the parent list
    // Parent List
    const plist: any = await apiOrg.templates.system.list({ filter });

    // Child List
    const clist: any = !organization.isSystem()
      ? await apiOrg.templates.list(organization.id(), { filter })
      : null;

    // Display Template State
    l.displayState = !organization.isSystem();

    // Get Intenal Reprentation
    const _internal: any = l._internal;

    // Save Pager from Parent List
    _internal.pager = plist.pager;
    _internal.query = plist.query;

    // RESET Internal Representation
    _internal.parentObject = null;
    _internal.childObject = !organization.isSystem() ? organization.id() : null;
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
        _internal.parentObject = (item as any).object;
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
          await apiOrg.templates.add(l._internal.childObject, id);
          _.set(entries, `${id}.state`, 1);
          break;
        case 1: // In Organization
          console.info(`Template [${id}] in Organization`);
          await apiOrg.templates.delete(l._internal.childObject, id);
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

  async function loadOrganization(id: string): Promise<Organization> {
    try {
      const r: any = await apiOrg.get(id);
      const org: Organization = new Organization(r);
      return org;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  async function loadOrganizationUser(
    org: string,
    user: string
  ): Promise<OrganizationUser> {
    try {
      const r: any = await apiOrgUser.get(org, user);
      const ou: OrganizationUser = new OrganizationUser(r);
      return ou;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  async function reloadStores(id: string): Promise<any> {
    try {
      // Reload Stores List
      const list: any = await apiOrg.stores.list(id);
      if (list != null) {
        stores = list.items ? list.items : [];
      }

      if (stores.length == 0) {
        console.log("Organization has No Stores");
      }

      return list;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  async function reloadAllOrgs(): Promise<any> {
    try {
      // Reload Stores List
      const list: any = await apiSystem.orgs.list();
      if (list != null) {
        allOrgs = list.items ? list.items : [];
      }

      if (allOrgs.length == 0) {
        console.log("No Organizations");
      }

      return list;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  async function reloadAllUsers(): Promise<any> {
    try {
      // Reload Stores List
      const list: any = await apiSystem.users.list();
      if (list != null) {
        allUsers = list.items ? list.items : [];
      }

      if (allUsers.length == 0) {
        console.log("No Users");
      }

      return list;
    } catch (e) {
      notify(e.toString());
      return null;
    }
  }

  // Page Initialization //
  async function start(): Promise<boolean> {
    console.log("start: org\\admin.svelte");

    try {
      const id: string = params.org;

      // TODO: Add Spinner
      organization = await loadOrganization(id);
      organizationUser = await loadOrganizationUser(id, user.id());

      // Is System Organization?
      if (!organization.isSystem()) {
        // Display Template List
        sflTemplatesList = createTemplatesList();

        // NO: Has Store List Access?
        if (
          organizationUser &&
          organizationUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_STORE,
              apiRoles.FUNCTION_LIST
            )
        ) {
          // YES: Load Stores
          listOfStores = await reloadStores(id);
        } else {
          listOfStores = null;
        }
      } else {
        // YES: Load All System Organizations and Users
        listAllOrgs = await reloadAllOrgs();
        listAllUsers = await reloadAllUsers();
      }

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
  <title>ObjectVault - Modify Organization [{params.org}]</title>
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
      </FormGroup>
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
      <Button type="submit" color="primary" class="w-100">Send</Button>
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

<ModalForm
  form={FormCreateStore}
  isOpen={storeOpen}
  toggle={toggleStoreModal}
  name="modalCreateStore"
  title="Create Store"
  on:formSubmit={onSubmitStoreCreate}
/>

<ModalForm
  form={FormCreateOrg}
  isOpen={orgOpen}
  toggle={toggleOrgModal}
  name="modalCreateOrg"
  title="Create Organization"
  on:formSubmit={onSubmitOrgCreate}
/>

<main class="container">
  {#if spinner}
    <Overlay>
      <Spinner />
    </Overlay>
  {/if}

  {#if user && organization}
    <div class="row mb-3">
      <div class="card p-0">
        <h3 class="card-header d-flex">
          <div class="col text-center">Org Administration</div>
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
              value={organization.name()}
            />
          </div>
        </div>
      </div>
    </div>
    {#if organizationUser}
      <div class="row d-flex flex-column flex-sm-row mb-3">
        {#if organizationUser
          .roles()
          .hasRole(apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_USER, apiRoles.FUNCTION_LIST)}
          <SingleFieldExplorer
            list={sflUsersList}
            class="col-12 col-sm-6 p-0"
          />
        {/if}
        {#if organizationUser
          .roles()
          .hasRole(apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_INVITE, apiRoles.FUNCTION_LIST)}
          <SingleFieldExplorer
            list={sflInvitationsList}
            class="col-12 col-sm-6 p-0"
          />
        {/if}
      </div>
      {#if sflTemplatesList && organizationUser
          .roles()
          .hasRole(apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_TEMPLATE, apiRoles.FUNCTION_LIST)}
        <div class="row mb-3">
          <TemplateExplorer list={sflTemplatesList} class="px-0" />
        </div>
      {/if}
      {#if !organization.isSystem()}
        {#if listOfStores != null}
          <div name="list-of-stores" class="row card">
            <h3 class="card-header d-flex">
              <div class="col text-center">Stores</div>
              {#if organizationUser
                .roles()
                .hasRole(apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_STORE, apiRoles.FUNCTION_CREATE)}
                <div name="actions" class="col-auto">
                  <Button color="primary" on:click={toggleStoreModal}>
                    <Icon name="plus-square" />
                    <span class="d-none d-md-inline">New Store</span>
                  </Button>
                </div>
              {/if}
            </h3>
            <div class="card-header">
              <div class="d-flex flex-column pt-2">
                <div class="d-flex">
                  <div class="input-group">
                    <button
                      type="button"
                      class="btn btn-primary dropdown-toggle"
                      id="dropdown"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <span class="align-text-bottom d-none d-sm-inline"
                        >Size:</span
                      >
                      <span class="align-text-bottom">10</span>
                    </button>
                    <div class="dropdown-menu" aria-labelledby="pageSize">
                      <a href="#" class="dropdown-item active">5</a>
                      <a href="#" class="dropdown-item">10</a>
                      <a href="#" class="dropdown-item">100</a>
                      <a href="#" class="dropdown-item">All</a>
                    </div>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Search text here"
                      aria-label="Text input with dropdown"
                    />
                    <button
                      type="button"
                      class="btn btn-primary"
                      id="buttonAfter"
                    >
                      <i class="bi-search" style="font-size: 1rem;" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <ul class="list-group list-group-flush">
              {#if hasPageUp(listOfStores)}
                <li class="list-group-item">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-no-outline w-100"
                  >
                    <i class="bi-arrow-bar-up text-primary" />
                  </button>
                </li>
              {/if}
              {#each stores as store}
                <li class="list-group-item d-flex">
                  <div class="col">
                    <i class="bi-sd-card-fill" />
                    <a
                      href="#/store/{store.store}"
                      class="link-secondary text-decoration-none"
                      >{store.alias}</a
                    >
                  </div>
                  <div class="col-auto">
                    <button
                      name="deleteStore"
                      type="button"
                      class="btn btn-outline-danger btn-no-outline px-1"
                    >
                      <i class="bi-dash-circle" />
                    </button>
                  </div>
                </li>
              {/each}
              {#if hasPageDown(listOfStores)}
                <li class="list-group-item">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-no-outline w-100"
                  >
                    <i
                      class="bi-arrow-bar-down text-primary"
                      style="font-size: 1rem;"
                    />
                  </button>
                </li>
              {/if}
            </ul>
          </div>
        {/if}
      {:else}
        <div class="row card mb-3">
          <h3 class="card-header d-flex">
            <div class="col text-center">All Organizations</div>
            <div name="actions" class="col-auto">
              <Button color="primary" on:click={toggleOrgModal}>
                <i class="bi-plus-square" />
                <span class="d-none d-md-inline">Organization</span>
              </Button>
            </div>
          </h3>
          <div class="card-header">
            <div class="d-flex flex-column pt-2">
              <div class="d-flex">
                <div class="input-group">
                  <button
                    type="button"
                    class="btn btn-primary dropdown-toggle"
                    id="dropdown"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <span class="align-text-bottom d-none d-sm-inline"
                      >Size:</span
                    >
                    <span class="align-text-bottom">10</span>
                  </button>
                  <div class="dropdown-menu" aria-labelledby="pageSize">
                    <a href="#" class="dropdown-item active">5</a>
                    <a href="#" class="dropdown-item">10</a>
                    <a href="#" class="dropdown-item">100</a>
                    <a href="#" class="dropdown-item">All</a>
                  </div>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search text here"
                    aria-label="Text input with dropdown"
                  />
                  <button
                    type="button"
                    class="btn btn-primary"
                    id="buttonAfter"
                  >
                    <i class="bi-search" style="font-size: 1rem;" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <ul class="list-group list-group-flush">
            {#if hasPageUp(listAllOrgs)}
              <li class="list-group-item">
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-no-outline w-100"
                >
                  <i class="bi-arrow-bar-up text-primary" />
                </button>
              </li>
            {/if}
            {#each allOrgs as org}
              <li class="list-group-item d-flex">
                <div class="col">
                  <i class="bi-building" />
                  {org.alias}
                </div>
                <div class="col-auto">
                  <button
                    name="deleteStore"
                    type="button"
                    class="btn btn-outline-danger btn-no-outline px-1"
                  >
                    <i class="bi-dash-circle" />
                  </button>
                </div>
              </li>
            {/each}
            {#if hasPageDown(listAllOrgs)}
              <li class="list-group-item">
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-no-outline w-100"
                >
                  <i
                    class="bi-arrow-bar-down text-primary"
                    style="font-size: 1rem;"
                  />
                </button>
              </li>
            {/if}
          </ul>
        </div>
        <div class="row card">
          <h3 class="card-header d-flex">
            <div class="col text-center">All Users</div>
          </h3>
          <div class="card-header">
            <div class="d-flex flex-column pt-2">
              <div class="d-flex">
                <div class="input-group">
                  <button
                    type="button"
                    class="btn btn-primary dropdown-toggle"
                    id="dropdown"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <span class="align-text-bottom d-none d-sm-inline"
                      >Size:</span
                    >
                    <span class="align-text-bottom">10</span>
                  </button>
                  <div class="dropdown-menu" aria-labelledby="pageSize">
                    <a href="#" class="dropdown-item active">5</a>
                    <a href="#" class="dropdown-item">10</a>
                    <a href="#" class="dropdown-item">100</a>
                    <a href="#" class="dropdown-item">All</a>
                  </div>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search text here"
                    aria-label="Text input with dropdown"
                  />
                  <button
                    type="button"
                    class="btn btn-primary"
                    id="buttonAfter"
                  >
                    <i class="bi-search" style="font-size: 1rem;" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <ul class="list-group list-group-flush">
            {#if hasPageUp(listAllUsers)}
              <li class="list-group-item">
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-no-outline w-100"
                >
                  <i class="bi-arrow-bar-up text-primary" />
                </button>
              </li>
            {/if}
            {#each allUsers as user}
              <li class="list-group-item d-flex">
                <div class="col">
                  <i class="bi-sd-card-fill" />
                  {user.alias}
                </div>
                <div class="col-auto">
                  <button
                    name="deleteStore"
                    type="button"
                    class="btn btn-outline-danger btn-no-outline px-1"
                  >
                    <i class="bi-dash-circle" />
                  </button>
                </div>
              </li>
            {/each}
            {#if hasPageDown(listAllUsers)}
              <li class="list-group-item">
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-no-outline w-100"
                >
                  <i
                    class="bi-arrow-bar-down text-primary"
                    style="font-size: 1rem;"
                  />
                </button>
              </li>
            {/if}
          </ul>
        </div>
      {/if}
    {/if}
  {:else}
    <h1>Loading</h1>
  {/if}
</main>
