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

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let _name: string = null;

  // MODULE EXPORTS
  export { _name as name };
  export let form: any;
  export let title: string;
  export let isOpen: boolean = false;
  export let toggle: any = null;
  export let formProps: any = {};

  // COMPONENT Bindable Parameters//
  let arMessages: string[] = [];

  // OBSERVERS //

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
      {...formProps}
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
