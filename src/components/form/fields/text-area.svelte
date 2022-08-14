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

  // SVELTESTAP
  import { FormGroup, Input, Label } from "sveltestrap";
  import type { FieldTemplate } from "../../../classes/form-template";

  // 3rd Party Libraries //
  import _ from "lodash";

  // Developer Libraries //
  import utilities from "../../../api/utilities";

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // CONSTANTS
  const defaults: any = {
    // DEFAULTS Settings for fields that alias this Field Componet
    settings: {
      text: {
        html: false,
      },
      "text-html": {
        html: true,
      },
    },
  };

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // view, create, update
  export let field: FieldTemplate; // Field Name
  export let value: string = ""; // Field Initial Value

  // Internal Variables
  let inner: HTMLTextAreaElement;

  // DEFAULT Options for fields that use text-area as UI
  // OBSERVERS
  $: _settings = fieldSettings(field);
  $: _validations = fieldValidations(field);
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // HELPERS //
  function defaultFieldValidations(t: string): any {
    const validations: any =
      defaults != null && defaults.hasOwnProperty("validations")
        ? defaults.validations
        : null;
    return validations && validations.hasOwnProperty(t) ? validations[t] : {};
  }

  function defaultFieldSettings(t: string): any {
    const settings: any =
      defaults != null && defaults.hasOwnProperty("settings")
        ? defaults.settings
        : null;
    return settings && settings.hasOwnProperty(t) ? settings[t] : {};
  }

  function fieldValidations(f: FieldTemplate) {
    const d: any = defaultFieldValidations(f.type());
    return _.merge({}, d, f.validations());
  }

  function fieldSettings(f: FieldTemplate) {
    const d: any = defaultFieldSettings(f.type());
    return _.merge({}, d, f.settings());
  }

  function setting(o: string, d?: any): any {
    return _.get(_settings, o, d);
  }

  // EVENT HANDLERS //
  function onResize(e: InputEvent) {
    inner.style.height = "auto";
    inner.style.height = 4 + inner.scrollHeight + "px";

    dispatch("onFieldValueChanged", {
      field,
      value: (e.target as any).value,
    });
  }

  // HELPERS //
</script>

{#if mode === "create" || mode === "update"}
  <FormGroup>
    <Label>{field.label()}</Label>
    <Input
      rows={1}
      type="textarea"
      bind:inner
      value={value == null ? "" : value}
      on:input={onResize}
    />
  </FormGroup>
{:else}
  <div>
    <Label>{field.label()}</Label>
    <pre>{value == null ? "" : value}</pre>
  </div>
{/if}
