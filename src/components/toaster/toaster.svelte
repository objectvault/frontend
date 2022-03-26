<script lang="ts">
  // SVELTE //
  import { onMount, onDestroy } from "svelte";

  // SVELTESTRAP //
  import { Toast, ToastBody, ToastHeader } from "sveltestrap";

  // STORES //
  import type { TNotify } from "./store";
  import store from "./store";

  // OTHER IMPORTS //
  import utilities from "../../api/utilities";

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };

  // Component Variables //
  let notifications: TNotify[] = [];
  let unsubscribe: any = null;
  let timerID: any = null;

  // OBSERVERS
  $: _containerClasses = utilities.strings.isNullOrEmpty(classes)
    ? "position-absolute bottom-0 end-0"
    : utilities.classes.merge("position-absolute bottom-0 end-0", classes);

  // HELPERS //
  function timerTick() {
    const close: TNotify[] = [];
    for (const n of notifications) {
      if (n.autohide) {
        const e: number = (n as any).__ticks - 1;
        if (e < 0) {
          close.push(n);
          continue;
        }

        (n as any).__ticks = e;
      }
    }

    for (const n of notifications) {
      const e: number = (n as any).__ticks;
      if (e <= 0) {
        console.info(`AUTO CLOSE [${n.idx}]`);
        onCloseNotification(n);
      }
    }
  }

  // EVENT HANDLERS //
  function onOpenNotification(n: TNotify): void {
    // Notification has Open Handler?
    if (n.onOpen !== null) {
      // YES: Call It
      n.onOpen(n);
    }
  }

  function onForceCloseNotification(n: TNotify): void {
    console.info(`FORCE CLOSE [${n.idx}]`);
    (n as any).__ticks = 0;
    onCloseNotification(n);
  }

  function onCloseNotification(n: TNotify): void {
    const e: number = (n as any).__ticks;
    if (e <= 0) {
      // Notification has Close Handler?
      if (n.onClose !== null) {
        // YES: Call It
        n.onClose(n);
      }

      // Remove Notification
      store.pop(n);
    }
  }

  // LIFECYCLE MANAGEMENT //
  onMount(() => {
    // Create Store Subscription
    unsubscribe = store.subscribe((list: TNotify[]) => (notifications = list));
    timerID = setInterval(() => timerTick(), 1000);
  });

  onDestroy(() => {
    // Release Subscription and timsr
    unsubscribe();
    clearInterval(timerID);
  });
</script>

{#if notifications.length}
  <div class={_containerClasses}>
    {#each notifications as n}
      <Toast
        class="me-1 mb-1"
        on:open={() => onOpenNotification(n)}
        on:close={() => onCloseNotification(n)}
      >
        {#if n.header != null}
          {#if n.autohide && n.period == 0}
            <ToastHeader>{n.header}</ToastHeader>
          {:else}
            <ToastHeader toggle={() => onForceCloseNotification(n)}
              >{n.header}</ToastHeader
            >
          {/if}
        {/if}
        <ToastBody>{n.body}</ToastBody>
      </Toast>
    {/each}
  </div>
{/if}
