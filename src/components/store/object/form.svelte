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
  import utilities from "../../../api/utilities";

  // CUSTOM Components //
  import FormField from "../../form/form-field.svelte";
  import FormGroup from "../../form/form-group.svelte";

  // CUSTOM Components ../form/form-field.svelteld from "./form-field.svel../form/form-group.svelte
  // Developer Libraries //
  import type { FormTemplate } from "../../../classes/form-template";

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // create, read, update
  export let template: FormTemplate = null; // Form Template
  export let values: any = null; // Form Values

  // COMPONENT VARIABLES
  let invalidElements: any = {}; // List Which Form Elements are Valid and Which are not

  // OBSERVERS
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "my-2")
  );

  // EVENT HANDLERS //
  function onValueChanged(e: CustomEvent) {
    const d: any = e.detail;
    const element: string = d.element;
    const elementValue: any = d.value;

    if (values == null) {
      values = {};
    }
    values[element] = elementValue;

    dispatch("onFormValuesChanged", values);
    console.log(`Form Element [${element}] - Modified`);
  }

  function onIsValidChanged(e: CustomEvent) {
    const d: any = e.detail;
    console.log(`Form Validity Change [${d.type}:${d.element}:${d.isValid}]`);

    // Change Element Invalid State
    const element: string = d.element;
    if (d.isValid) {
      delete invalidElements[element];
    } else {
      invalidElements[element] = true;
    }

    // Get List of Invalid Elements
    const invalid: string[] = Object.keys(invalidElements);
    console.log(`Current Form Validity is [${invalid.length == 0}]`);

    // Notify of Change in State
    dispatch("onIsFormValidChanged", {
      isValid: invalid.length == 0,
      invalid,
    });
  }

  // HELPERS //
  function getElementValue(field: string): any {
    return values && values[field] ? values[field] : null;
  }
</script>

<div id="form-container" class={_classes}>
  <FormField
    class="mb-1"
    {mode}
    field="__title"
    template={template.field("__title")}
    value={getElementValue("__title")}
    on:onValueChanged={onValueChanged}
    on:onIsValidChanged={onIsValidChanged}
  />
  {#each template.groups() as group}
    <FormGroup
      class="mb-2"
      {mode}
      {group}
      values={getElementValue(group)}
      {template}
      on:onValueChanged={onValueChanged}
      on:onIsValidChanged={onIsValidChanged}
    />
  {/each}
</div>
