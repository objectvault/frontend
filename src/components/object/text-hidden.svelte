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
  import { Button, Icon, Input, InputGroup, InputGroupText } from "sveltestrap";
  import type { TemplateField } from "../../classes/form-template";

  // 3rd Party Libraries //
  import _ from "lodash";

  // Developer Libraries //
  import utilities from "../../api/utilities";

  // CONSTANTS
  const defaults: any = {
    // DEFAULTS Settings for fields that alias this Field Componet
    settings: {
      password: {
        confirmation: true,
        eye: true,
      },
    },
  };

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // view, create, update
  export let field: TemplateField; // Field Name
  export let value: string = ""; // Field Initial Value

  // Internal Variables
  let bShowText: boolean = false;
  let confirmation: string = ""; // Confirmation Initial Value

  // OBSERVERS
  $: _settings = fieldSettings(field);
  $: _validations = fieldValidations(field);
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

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

  function fieldValidations(f: TemplateField) {
    const d: any = defaultFieldValidations(f.type());
    return _.merge({}, d, f.validations());
  }

  function fieldSettings(f: TemplateField) {
    const d: any = defaultFieldSettings(f.type());
    return _.merge({}, d, f.settings());
  }

  function setting(o: string, d?: any): any {
    return _.get(_settings, o, d);
  }

  // EVENT HANDLERS //
  function onToggleShow(e: Event) {
    e.preventDefault(); // NEEDED: Clicking on Button Closes Dialog
    bShowText = !bShowText;
  }

  function onChangeValue(e: InputEvent) {
    dispatch("onFieldValueChanged", {
      field,
      value: (e.target as any).value,
    });
  }

  function onChangeConfirmationValue(e: InputEvent) {
    confirmation = (e.target as any).value;
  }
  // HELPERS //
</script>

<InputGroup>
  <InputGroupText class="col-3">{field.label()}</InputGroupText>
  <Input
    type={bShowText ? "text" : "password"}
    value={value == null ? "" : value}
    on:input={onChangeValue}
    disabled={mode === "view"}
  />
  {#if setting("eye", true)}
    <Button
      class="col-auto input-group-text"
      tabindex={-1}
      on:click={onToggleShow}
    >
      <Icon name="eye" />
    </Button>
  {/if}
</InputGroup>

{#if mode !== "view" && setting("confirmation", true) && !bShowText}
  <InputGroup>
    <InputGroupText class="col-3">Confirmation</InputGroupText>
    <Input
      type="password"
      value={confirmation == null ? "" : confirmation}
      on:input={onChangeConfirmationValue}
    />
  </InputGroup>
{/if}
