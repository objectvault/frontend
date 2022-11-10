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

  // NOTE: Organization READ Role (33882113) is REQUIRED and HIDDEN in invitation
  let updatedRoles: Roles = new Roles();

  let bFormInvalid: boolean = false;

  let classes: string = "";
  let buttonColor: string = "primary";

  // OBSERVERS //

  // Form Class
  $: classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "my-2")
  );

  // Submit Button Color
  $: buttonColor = bFormInvalid ? "primary" : "success";

  // Calculate Form Valid State
  $: bFormInvalid = updatedRoles.isEmpty();

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

    const existing: Role = roles.get(r.category());
    const update: Role = updatedRoles.get(r.category());

    // New update?
    if (update === null) {
      // YES: Has update modified existing role
      if (existing !== null && existing.isEqual(update)) {
        // NO: Skip
        return;
      }

      updatedRoles = updatedRoles.add(r);
      return;
    }
    // ELSE: Update to Update

    // Has Update Changed?
    if (update.isEqual(r)) {
      // NO: Ignore
      return;
    }

    // Any Existing Role Functions?
    if (existing === null) {
      // NO: Update Has any Function?
      if (r.functions() !== 0) {
        // YES: Update
        updatedRoles = updatedRoles.add(r);
      } else {
        // NO: Delete Entry
        updatedRoles = updatedRoles.del(r.category());
      }
      return;
    }

    // Is update a reset?
    if (existing.isEqual(r)) {
      // YES
      updatedRoles = updatedRoles.del(r.category());
      return;
    }

    updatedRoles = updatedRoles.add(update);
    console.log(e);
  }

  function onSubmitForm(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Dispatch Invite Click
    dispatch("formSubmit", {
      roles: roles,
      updateRoles: updatedRoles,
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
    <Button type="submit" color="primary" class="w-100" disabled={bFormInvalid}
      >Modify</Button
    >
  {/if}
</Form>
