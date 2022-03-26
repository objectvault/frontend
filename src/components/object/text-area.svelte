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
  import type { TemplateField } from "../../classes/form-template";

  // Developer Libraries //
  import utilities from "../../api/utilities";

  // CONSTANTS

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // view, create, update
  export let field: TemplateField; // Field Name
  export let value: string = ""; // Field Initial Value

  // Internal Variables
  let inner: HTMLTextAreaElement;

  // OBSERVERS
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // EVENT HANDLERS //
  function resize(e: InputEvent) {
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
      on:input={resize}
    />
  </FormGroup>
{:else}
  <div>
    <Label>{field.label()}</Label>
    <pre>
      {value == null ? "" : value}
    </pre>
  </div>
{/if}
