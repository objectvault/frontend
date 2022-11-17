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
  // SVELTESTRAP //
  import {
    Button,
    Icon,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "sveltestrap";

  // Developer Libraries //
  import type { TAction, CBActionHandler } from "../objects/actions";
  import __actions from "../objects/actions";

  // SPECIAL EXPORT - Treat classes as class attribute
  let _name: string = null;

  // MODULE EXPORTS
  export { _name as name };
  export let title: string;
  export let message: string;
  export let isOpen: boolean = false;
  export let actions: TAction[] = [];
  export let messages: string[] = [];

  // COMPONENT Bindable Parameters//

  // OBSERVERS //
  $: _closeHandler = !__actions.actionInArray(actions, "__close")
    ? null
    : () => callAction("__close");

  // HELPERS //
  function classesListActionButton(i: number, a: TAction): string {
    return "col";
  }

  function callAction(id: string) {
    const a: TAction = __actions.actionInArray(actions, id);

    if (a !== null) {
      const h: CBActionHandler = __actions.actionHandler(a, () =>
        console.info(`NO HANDLER: Clicked [${a.id}]`)
      );

      // Call Action Handler
      h(a);
    }
  }

  // EVENTS //
  function onListAction(e: Event, a: TAction) {
    // Stop Default Processing
    e.preventDefault();

    const h: CBActionHandler = __actions.actionHandler(a, () =>
      console.info(`NO HANDLER: Clicked [${a.id}]`)
    );

    // Call Action Handler
    h(a);
  }
</script>

<Modal {isOpen} toggle={_closeHandler} name={_name} {...$$restProps}>
  <ModalHeader toggle={_closeHandler}>{title}</ModalHeader>
  <ModalBody>
    <div class="d-flex flex-column mx-auto" style="width: 80%;">
      <div class="row mb-3">
        <h4 class="col">{message}</h4>
      </div>
      {#if actions.length > 0}
        <div name="actions" class="d-flex justify-content-around">
          {#each actions as a, i}
            {#if __actions.isActionDisplayed(a)}
              <Button
                name={a.id}
                color={__actions.actionColor(a, "primary")}
                class={__actions.classes(a, "container", "col")}
                disabled={__actions.isActionDisabled(a)}
                on:click={(e) => onListAction(e, a)}
              >
                {#if __actions.actionIcon(a)}
                  <Icon
                    class={__actions.classes(a, "icon")}
                    name={__actions.actionIcon(a, "patch-question-fill")}
                  />
                {/if}
                {#if __actions.label(a)}
                  <span class={__actions.classes(a, "label")}
                    >{__actions.label(a, "?")}</span
                  >
                {/if}
              </Button>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </ModalBody>
  {#if messages.length}
    <ModalFooter class="flex-column align-items-baseline text-danger">
      {#each messages as m}
        <div>{m}</div>
      {/each}
    </ModalFooter>
  {/if}
</Modal>
