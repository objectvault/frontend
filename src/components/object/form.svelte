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
  import { Button, Form, Input, InputGroup, InputGroupText } from "sveltestrap";

  // Developer Libraries //
  import utilities from "../../api/utilities";

  // CUSTOM Components //
  import ObjectFormGroup from "./group.svelte";

  // API //
  import type { TemplateObjectAdaptor } from "../../classes/template-object-adapter";

  // CONSTANTS

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string = "view"; // view, create, update
  export let object: TemplateObjectAdaptor; // Form Object

  // COMPONENT VARIABLES
  let objectTitle: string = object.title();

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // OBSERVERS
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "my-2")
  );

  // EVENTS //
  async function onSubmitForm(e: Event) {
    // Stop Form Submission
    e.preventDefault();
    console.log("onSubmitForm");

    dispatch("onSubmitObject", {
      mode,
      object,
    });
  }

  function onChangeTitle(e: InputEvent) {
    const v: any = (e.target as any).value;
    object.setField("title", v);
    console.log(`Group [header] - Modified`);
  }

  function onGroupModified(e: CustomEvent) {
    const g: string = e.detail;
    console.log(`Group [${g}] - Modified`);
  }

  // HELPERS //
</script>

<Form id="formObjectSettings" class={_classes} on:submit={onSubmitForm}>
  <InputGroup class="d-flex mb-3">
    <InputGroupText class="col-3">Title</InputGroupText>
    <Input
      type="text"
      name="object-title"
      placeholder="Object Title"
      required
      value={objectTitle}
      on:input={onChangeTitle}
      disabled={mode === "view"}
    />
  </InputGroup>
  {#each object.groups() as group}
    <ObjectFormGroup
      {mode}
      {group}
      {object}
      on:onGroupModified={onGroupModified}
    />
  {/each}
  {#if mode != "view"}
    <Button type="submit" color="primary" class="w-100">
      {mode === "create" ? "Create" : "Update"}
    </Button>
  {/if}
</Form>
