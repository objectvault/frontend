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
  import type { TemplateField } from "../../classes/form-template";
  import type { TemplateObjectAdaptor } from "../../classes/template-object-adapter";

  // FIELD Components //
  import TextArea from "./text-area.svelte";
  import TextField from "./text-field.svelte";
  import TextHidden from "./text-hidden.svelte";

  // CONSTANTS
  const mapComponent = {
    // Map Field Type to Display Entity
    text: TextArea,
    url: TextField,
    user: TextField,
    password: TextHidden,
  };

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // view, create, update
  export let field: string; // Field Name
  export let object: TemplateObjectAdaptor; // Form Object

  // Component Variables
  let notifyTimeoutID: number = null;

  // OBSERVERS
  $: _field = object.field(field);
  $: _value = object.value(field, null);
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // HELPERS //

  // EVENT HANDLERS //
  function onFieldValueChanged(e: CustomEvent) {
    // Have Pending Notification?
    if (notifyTimeoutID != null) {
      //YES: Clear it
      clearTimeout(notifyTimeoutID);
      notifyTimeoutID = null;
    }

    // Have Pending Notification?
    if (notifyTimeoutID === null) {
      // NO: Notify on Delay
      notifyTimeoutID = setTimeout(() => {
        const f: string = _field.name();
        const v: any = e.detail.value;
        object.setField(f, v);
        dispatch("onFieldModified", f);
      }, 300);
    }
  }

  // HELPERS //
</script>

<div class={_classes}>
  <svelte:component
    this={mapComponent[_field.type()]}
    {mode}
    field={_field}
    value={_value}
    on:onFieldValueChanged={onFieldValueChanged}
  />
</div>
