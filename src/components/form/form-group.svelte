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
  import type { FormTemplate } from "../../classes/form-template";

  // CUSTOM Components //
  import FormField from "./form-field.svelte";

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // view, create, update
  export let group: string; // Group Name
  export let values: any = null; // Group Values
  export let template: FormTemplate; // Form Template

  // Component Variables
  let invalidElements: any = {}; // List Which Fields are Valid and Which are not

  // OBSERVERS
  $: _group = template.group(group); // Group Template
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // EVENT HANDLERS //
  function onValueChanged(e: CustomEvent) {
    const d: any = e.detail;
    const element: string = d.element;
    const value: any = d.value;

    if (values == null) {
      values = {};
    }
    values[element] = value;

    console.log(`Group [${group}:${element}] - Modified`);

    dispatch("onValueChanged", {
      type: "group",
      element: group,
      value: values,
    });
  }

  function onIsValidChanged(e: CustomEvent) {
    const d: any = e.detail;
    console.log(`Group Validity Change [${d.type}:${d.element}:${d.isValid}]`);

    // Change Element Invalid State
    const element: string = d.element;
    if (d.isValid) {
      delete invalidElements[element];
    } else {
      invalidElements[element] = true;
    }

    // Get List of Invalid Elements
    const invalid: string[] = Object.keys(invalidElements);
    console.log(`Current Group Validity is[${invalid.length == 0}]`);

    // Notify of Change in State
    dispatch("onIsValidChanged", {
      type: "group",
      element: group,
      isValid: invalid.length === 0,
      invalid,
    });
  }

  // HELPERS //
  function getElementValue(field: string): any {
    return values && values[field] ? values[field] : null;
  }
</script>

{#each _group.fields() as field}
  <FormField
    class="mb-1"
    {mode}
    {field}
    value={getElementValue(field)}
    template={template.field(field)}
    on:onValueChanged={onValueChanged}
    on:onIsValidChanged={onIsValidChanged}
  />
{/each}
