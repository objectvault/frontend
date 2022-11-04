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
  import { Modal, ModalBody, ModalFooter, ModalHeader } from "sveltestrap";

  // Application LIBRARIES //
  import utilities from "../api/utilities";

  // TypeScript Types
  type TMessageMap = {
    [key: string]: string;
  };

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let _classes: string = null;
  let _name: string = null;

  // MODULE EXPORTS
  export { _classes as class };
  export { _name as name };
  export let form: any;
  export let title: string;
  export let isOpen: boolean = false;
  export let toggle: any = null;

  // COMPONENT Bindable Parameters//
  let arMessages: string[] = [];

  // OBSERVERS //

  // Form Class
  $: classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "my-2")
  );

  // EVENTS //
  function onFormMessages(e: CustomEvent) {
    const ms: any = e.detail;
    arMessages = ms ? ms : [];
  }

  function onSubmitForm(e: CustomEvent) {
    const d: any = e.detail;

    // Forward Event
    dispatch("formSubmit", d);
  }
</script>

<Modal {isOpen} {toggle} name={_name} {...$$restProps}>
  <ModalHeader {toggle}>{title}</ModalHeader>
  <ModalBody>
    <svelte:component
      this={form}
      on:formSubmit={onSubmitForm}
      on:formMessages={onFormMessages}
    />
  </ModalBody>
  {#if arMessages.length}
    <ModalFooter class="flex-column align-items-baseline text-danger">
      {#each arMessages as messsage}
        <div>{messsage}</div>
      {/each}
    </ModalFooter>
  {/if}
</Modal>
