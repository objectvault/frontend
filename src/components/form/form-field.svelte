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
  import type { FieldTemplate } from "../../classes/form-template";

  // FIELD Components //
  import TextArea from "./fields/text-area.svelte";
  import TextField from "./fields/text-field.svelte";
  import TextHidden from "./fields/text-hidden.svelte";

  // CONSTANTS
  const mapComponent = {
    // Map Field Type to Display Entity
    string: TextField,
    text: TextArea,
    url: TextField,
    user: TextField,
    password: TextHidden,
  };

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // view, create, update
  export let field: string; // Field Name
  export let template: FieldTemplate; // Template for Field
  export let value: any = null; // Field Value
  export let isValid: boolean = false; // Is Field Value
  export let timeout: number = 300; // Is Field Value

  // Component Variables
  let timeoutIDs: any = {
    change: null,
    valid: null,
  };

  // OBSERVERS
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // EVENT HANDLERS //
  function onValueChanged(e: CustomEvent) {
    // Have Pending Notification?
    if (timeoutIDs["change"] != null) {
      //Y ES: Clear it
      clearTimeout(timeoutIDs["change"]);
      timeoutIDs["change"] = null;
    }

    // Have Pending Notification?
    if (timeoutIDs["change"] === null) {
      // NO: Notify on Delay
      timeoutIDs["change"] = setTimeout(() => {
        value = e.detail.value;
        dispatch("onValueChanged", {
          type: "field",
          element: field,
          value,
        });
      }, timeout);
    }
  }

  function onIsValidChanged(e: CustomEvent) {
    // Have Pending Notification?
    if (timeoutIDs["valid"] != null) {
      // YES: Clear it
      clearTimeout(timeoutIDs["valid"]);
      timeoutIDs["valid"] = null;
    }

    // Have Pending Notification?
    if (timeoutIDs["valid"] === null) {
      // NO: Notify on Delay
      timeoutIDs["valid"] = setTimeout(() => {
        const d: any = e.detail;
        console.log(`Field Validity Change [${d.field}:${d.isValid}]`);

        if (isValid != d.isValid) {
          isValid = d.isValid;
          console.log(`Field is now [${isValid}]`);

          dispatch("onIsValidChanged", {
            type: "field",
            element: field,
            isValid,
          });
        }
      }, timeout);
    }
  }
</script>

<div class={_classes}>
  <svelte:component
    this={mapComponent[template.type()]}
    {mode}
    field={template}
    {value}
    on:onFieldValueChanged={onValueChanged}
    on:onIsValidChanged={onIsValidChanged}
  />
</div>
