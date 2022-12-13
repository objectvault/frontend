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
  import { createEventDispatcher } from "svelte";

  // SVELTESTRAP //
  import { Button, Form } from "sveltestrap";

  // CUSTOM Components //
  import RolesManager from "../roles-manager.svelte";

  // Application LIBRARIES //
  import apiRoles from "../../api/roles";
  import utilities from "../../api/utilities";
  import { Role, Roles } from "../../classes/roles";

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let _classes: string = null;

  // MODULE EXPORTS
  export { _classes as class };
  export let roles: Roles;
  export let isSystemOrg: boolean = false;
  export let isAdmin: boolean = false;
  export let readOnly: boolean = false;

  // COMPONENT Bindable Parameters//

  // NOTE: Organization READ Role (33882113) is REQUIRED and HIDDEN in invitation
  let updatedRoles: Roles = new Roles();
  let deletedRoles: Roles = new Roles();

  let classes: string = "";
  let bFormModified: boolean = false;
  let buttonColor: string = "primary";

  // OBSERVERS //

  // Form Class
  $: classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "my-2")
  );

  // Submit Button Color
  $: buttonColor = !bFormModified ? "primary" : "success";

  // Helpers //
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
        fixed: apiRoles.FUNCTION_CREATE | apiRoles.FUNCTION_DELETE,
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
    if (isSystemOrg) {
      if (isAdmin) {
        roles_list["System Functions"] = system_roles;
      }
      roles_list["Organization Functions"] = org_0_roles;
    } else {
      roles_list["Organization Functions"] = org_not_0_roles;
    }

    return roles_list;
  }

  // EVENTS //
  function onUpdateRoles(e: CustomEvent) {
    const v: number = e.detail.value;
    const r: Role = new Role(v);
    const c: number = r.category();

    const existing: Role = roles.get(c);

    // Does Modified Role Contain any Functions?
    if (r.functions() === 0) {
      // NO: Deleting Role
      updatedRoles.del(c);

      // Does Role Exist?
      if (existing) {
        // YES: Mark it for Delete
        deletedRoles.add(existing);
      }

      // Calculate Form Valid State
      bFormModified = !updatedRoles.isEmpty() || !deletedRoles.isEmpty();
      return;
    }

    // Modifying Existing Role?
    if (existing !== null) {
      // YES: Has update modified existing role?
      if (existing.isEqual(r)) {
        // NO: Clear Existing Changes
        updatedRoles.del(c);
        deletedRoles.del(c);
      } else {
        // YES: Modify Update
        updatedRoles.add(r);
        deletedRoles.del(c);
      }

      // Calculate Form Valid State
      bFormModified = !updatedRoles.isEmpty() || !deletedRoles.isEmpty();
      return;
    }
    //ELSE: No Existing Role: Update Changes
    updatedRoles.add(r);
    deletedRoles.del(c);

    // Calculate Form Valid State
    bFormModified = !updatedRoles.isEmpty() || !deletedRoles.isEmpty();
  }

  function onSubmitForm(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Dispatch Invite Click
    dispatch("formSubmit", {
      roles: roles,
      updateRoles: updatedRoles,
      deleteRoles: deletedRoles,
    });
  }

  // LIFECYCLE MANAGEMENT //
</script>

<Form id="formOrgUserPermissions" class="my-2" on:submit={onSubmitForm}>
  <RolesManager
    labels={{
      x: {
        label: "Permissions in Organization",
      },
    }}
    roles={csvRolesToManagerList(roles)}
    {readOnly}
    on:roleModified={onUpdateRoles}
  />
  {#if !readOnly}
    <hr />
    <Button
      type="submit"
      color={buttonColor}
      class="w-100"
      disabled={!bFormModified}>Modify</Button
    >
  {/if}
</Form>
