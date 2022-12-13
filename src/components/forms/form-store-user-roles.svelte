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
  export let readOnly: boolean = false;

  // COMPONENT Bindable Parameters//

  // NOTE: Store READ Role (33882113) is REQUIRED and HIDDEN in invitation
  let updatedRoles: Roles = new Roles();
  let deletedRoles: Roles = new Roles();

  let classes: string = "";
  let bFormModified: boolean = false;
  let buttonColor: string;

  // OBSERVERS //

  // Form Class
  $: classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "my-2")
  );

  // Submit Button Color
  $: buttonColor = !bFormModified ? "primary" : "success";

  // Helpers //
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
        id: "templates",
        label: "Templates",
        icon: "file-text",
        value: apiRoles.extractRole(
          apiRoles.CATEGORY_STORE | apiRoles.SUBCATEGORY_TEMPLATE,
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
        label: "Permissions in Store",
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
