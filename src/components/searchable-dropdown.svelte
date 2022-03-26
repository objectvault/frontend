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
  import { onMount, createEventDispatcher } from "svelte";

  // SVELTESTRAP //
  import {
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Dropdown,
    Input,
  } from "sveltestrap";

  // Other Libraries //
  import _ from "lodash";

  // Developer Libraries //
  import utilities from "../api/utilities";

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let items: any[] = [];
  export let mapper: any = null;
  export let disabled: boolean = false;
  export let select: string = null;

  // COMPONENT Bindable Paramters//
  let isListOpen: boolean = false; //
  let selected: any = null; // Selected Item

  // OBSERVERS
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes),
    ""
  );

  // DEBUG
  $: console.log(`Template Selected [${select}]`);

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // HELPERS //
  function getValue(v: any): string {
    if (v != null) {
      if (_.isString(v)) {
        return v;
      } else if (mapper) {
        if (_.isFunction(mapper)) {
          return mapper(v, "value");
        } else if (
          _.isPlainObject(v) &&
          _.isPlainObject(mapper) &&
          mapper.value
        ) {
          return _.get(v, mapper.value, "");
        }
      }
    }

    return "";
  }

  function getDisplayValue(v: any): string {
    if (v != null) {
      if (_.isString(v)) {
        return v;
      } else if (mapper) {
        if (_.isFunction(mapper)) {
          return mapper(v, "label");
        } else if (
          _.isPlainObject(v) &&
          _.isPlainObject(mapper) &&
          mapper.label
        ) {
          return _.get(v, mapper.label, "");
        }
      }
    }

    return "";
  }

  function selectionChange(item: any) {
    // Has Selection Changed?
    if (selected == null || selected.name !== item.name) {
      // YES: Update
      selected = item;
      dispatch("template", item.name);
    }
  }

  // EVENTS //
  function onItemSelect(e: Event, item: any) {
    e.preventDefault();

    // Update Selection
    selectionChange(item);
  }

  // SVELTE MOUNT //
  onMount(() => {
    // Do we have a predefined value to be selected?
    if (select != null) {
      // YES: Find it in the List and Select it
      for (let item of items) {
        if (item.name === select) {
          selectionChange(item);
          break;
        }
      }
    }
  });
</script>

{#if items && items.length}
  <Dropdown
    class={_classes}
    isOpen={isListOpen}
    toggle={() => (isListOpen = !isListOpen)}
  >
    <DropdownToggle tag="div" class="d-inline-block" {disabled}>
      <Input value={getDisplayValue(selected)} {disabled} />
    </DropdownToggle>
    <DropdownMenu>
      {#each items as item}
        <DropdownItem
          on:click={(e) => onItemSelect(e, item)}
          data-value={getValue(item)}>{getDisplayValue(item)}</DropdownItem
        >
      {/each}
    </DropdownMenu>
  </Dropdown>
{/if}
