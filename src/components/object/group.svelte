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

  // Developer Libraries //
  import utilities from "../../api/utilities";
  import type { TemplateObjectAdaptor } from "../../classes/template-object-adapter";

  // CUSTOM Components //
  import FormField from "./field.svelte";

  // CONSTANTS

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // view, create, update
  export let group: string; // Group Name
  export let object: TemplateObjectAdaptor; // Form Object

  // OBSERVERS
  $: _group = object.group(group);
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // EVENT HANDLERS //
  function onFieldModified(e: CustomEvent) {
    const f: string = e.detail;
    console.log(`Field [${f}] - Modified`);

    dispatch("onGroupModified", group);
  }

  // HELPERS //
</script>

<form class={_classes}>
  {#each _group.fields() as field}
    <FormField {mode} {field} {object} on:onFieldModified={onFieldModified} />
  {/each}
</form>
