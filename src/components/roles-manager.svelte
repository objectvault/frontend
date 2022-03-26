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
  import { FormCheck, Icon } from "sveltestrap";

  // Other Libraries //
  import _ from "lodash";

  // Developer Libraries //
  import utilities from "../api/utilities";
  import RoleAPI from "../api/roles";

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let labels: any = null;
  export let roles: any;
  export let readOnly: boolean = false;

  // ROLE FUNCTIONS
  const _flags: any = {
    read: RoleAPI.FUNCTION_READ_LIST,
    create: RoleAPI.FUNCTION_CREATE,
    update: RoleAPI.FUNCTION_UPDATE,
    delete: RoleAPI.FUNCTION_DELETE,
  };

  const _flagIDs: string[] = Object.keys(_flags);

  const _labelDefaults: any = {
    x: {
      label: "Role Functions",
      icon: null,
    },
    y: {
      label: "Categories",
      icon: null,
    },
    create: {
      label: "Create",
      icon: null,
    },
    read: {
      label: "Read/List",
      icon: null,
    },
    update: {
      label: "Update",
      icon: null,
    },
    delete: {
      label: "Delete",
      icon: null,
    },
  };

  // OBSERVERS
  $: _labels = _.merge({}, _labelDefaults, labels);
  $: _groups = Object.keys(roles).filter((k) => roles.hasOwnProperty(k));
  $: _sectionClasses = utilities.strings.isNullOrEmpty(classes)
    ? ""
    : utilities.classes.merge("card", classes);

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // HELPERS
  function isBitsSet(value: number, bits: number): boolean {
    return (value & bits) === bits;
  }

  function isFlagSet(role: any, flagID: string): boolean {
    const flag: number = _flags[flagID];
    return isBitsSet(role.value, flag);
  }

  function isFlagFixed(role: any, flagID: string): boolean {
    // Is Read Only Mode
    if (readOnly) {
      // YES
      return true;
    }

    const flag: number = _flags[flagID];
    return role.fixed != null ? isBitsSet(role.fixed, flag) : false;
  }

  function setRoleFlag(role: any, flagID: string): number {
    const old: number = role.value;
    role.value = RoleAPI.setFunction(old, _flags[flagID]);
    return old;
  }

  function clearRoleFlag(role: any, flagID: string): number {
    const old: number = role.value;
    role.value = RoleAPI.clearFunction(old, _flags[flagID]);
    return old;
  }

  function hasRoleIcon(role: any): boolean {
    const i: any = _.get(role, "icon");
    return i != null;
  }

  function getRoleIcon(role: any, d?: string): string {
    let i: any = _.get(role, "icon");
    if (_.isFunction(i)) {
      i = i(role);
    }
    return _.isString(i) ? i : d;
  }

  function getRoleLabel(role: any, d?: string): string {
    let l: any = _.get(role, "label");
    if (_.isFunction(l)) {
      l = l(role);
    }
    return _.isString(l) ? l : d;
  }

  function getRoleID(role: any, d?: string): string {
    let id: any = _.get(role, "id");
    return _.isString(id) ? id : d;
  }

  function getFunctionName(role: any, flagID: string): string {
    let id: string = getRoleID(role);
    return `${id}-${flagID}`;
  }

  // EVENTS //
  function onToggleRoleFlag(e: Event, role: any, flagID: string): void {
    console.info(`${role.id} toggled flag ${flagID} to ${e.target.checked}`);
    const old: number = (e.target as any).checked
      ? setRoleFlag(role, flagID)
      : clearRoleFlag(role, flagID);

    console.info(`${old.toString(16)} to ${role.value.toString(16)}`);

    dispatch("roleModified", {
      role: role.id,
      value: role.value,
      old,
    });
  }
</script>

{#each _groups as group}
  <section class={_sectionClasses}>
    <div class="row" name="roles">
      <div class="col-sm-3" />
      <div class="col-sm-9 border-bottom text-center">
        {group}
      </div>
    </div>
    <div class="row">
      <div class="col-sm-3 border-end border-bottom">{_labels.y.label}</div>
      {#each _flagIDs as flagID, i}
        <div class={i === 0 ? "col-sm-3 text-center" : "col-sm-2 text-center"}>
          {_labels[flagID].label}
        </div>
      {/each}
    </div>
    {#each roles[group] as role, i}
      <div class="row" name="store-permissions">
        <div class="col-sm-3 border-end">
          {#if hasRoleIcon(role)}
            <Icon
              name={getRoleIcon(role, "question-circle")}
              class="text-primary"
            />
          {/if}
          {getRoleLabel(role)}
        </div>

        {#each _flagIDs as flagID, i}
          <div class={i === 0 ? "col-sm-3" : "col-sm-2"}>
            <FormCheck
              name={getFunctionName(role, flagID)}
              type="switch"
              checked={isFlagSet(role, flagID)}
              disabled={isFlagFixed(role, flagID)}
              on:change={(e) => onToggleRoleFlag(e, role, flagID)}
            />
          </div>
        {/each}
      </div>
    {/each}
  </section>
{/each}
