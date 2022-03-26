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
  import { onMount, createEventDispatcher } from "svelte";

  // SVELTESTRAP //
  import { Button, Icon, Input, InputGroup, InputGroupText } from "sveltestrap";

  // Developer Libraries //
  import apiInvite from "../api/invite";
  import utilities from "../api/utilities";

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = "";

  // LIST: Associated Objects
  let list: any = null; // List of Pending User Invitations
  let invitations: any[] = []; // Invitations Array
  let listFilters: any = {};
  let emailFilter: string = "";
  let filterTimeoutID: any = null;

  // Parameter Constants
  const filterTimeout: number = 500;

  // MODULE EXPORTS
  export { classes as class };
  export let objectID: string;
  export let title: string = "Invitations";

  // OBSERVERS
  $: sectionClasses = utilities.classes.merge("card", classes);

  // SVELTE: Event Dispatcher
  const dispatch = createEventDispatcher();

  // HELPERS
  function hasPageUp(l: any) {
    if (l != null && typeof l.pager == "object") {
      const p: any = l.pager;
      return p.offset > 0;
    }

    return false;
  }

  function hasPageDown(l: any) {
    if (l != null && typeof l.pager == "object") {
      const p: any = l.pager;
      const last: number = p.offset + p.count;
      return last < p.countAll;
    }

    return false;
  }

  function generateObjectFilter(): string {
    let filters: string[] = [];
    // Filter Priority (index) least important to most important
    for (const key of ["email"]) {
      if (!listFilters.hasOwnProperty(key)) {
        continue;
      }

      switch (key) {
        case "email":
          filters.push(`contains(email, "${listFilters.email}")`);
          break;
      }
    }

    let filter: string = null;
    for (let i = 0; i < filters.length; ++i) {
      if (i == 0) {
        filter = filters[i];
      } else {
        filter = `and(${filters[i]}, ${filter})`;
      }
    }

    return filter;
  }

  async function reloadInvitations(id: string): Promise<any> {
    try {
      // Reload Invitations List
      const filter: string = generateObjectFilter();
      const l: any = await apiInvite.list(id, { filter });
      if (l != null) {
        list = l;
        invitations = l.items ? l.items : [];
      }

      if (invitations.length == 0) {
        console.log("Organization has No Invitations");
      }

      return true;
    } catch (e) {
      throw e;
    }
  }

  async function reloadList(immed = false): Promise<any> {
    // Do we have Timer Set?
    if (filterTimeoutID != null) {
      // YES: Clear it
      clearTimeout(filterTimeoutID);
      filterTimeoutID = null;
    }

    // Call Immediately?
    if (!immed) {
      // NO: Delay Call
      filterTimeoutID = setTimeout(
        () => reloadInvitations(objectID),
        filterTimeout
      );
      return null;
    }

    return await reloadInvitations(objectID);
  }

  // EVENTS //
  function onCreateInvite(e: Event) {
    // Stop Default Processing
    e.preventDefault();

    // Dispatch Invite Click
    dispatch("create-invite", {
      refresh: () => reloadInvitations(objectID),
    });
  }

  function onClearFilter(e: Event) {
    emailFilter = "";

    // NO: Do we have Title Filter Set?
    if (listFilters.hasOwnProperty("email")) {
      // YES: Remove it
      delete listFilters.email;
      reloadList();
    }
  }

  function onBindEmail(e: InputEvent) {
    const source: string = (e.target as any).value;
    let value: string = source;

    // Cleanup Value
    value = value.trim().toLowerCase();

    // Does it match current input?
    if (value.length != source.length || value != source) {
      // NO: Update Current Input
      emailFilter = value;
    }

    // Do we have a value for Title Filter?
    if (value.length === 0) {
      // NO: Do we have Title Filter Set?
      if (listFilters.hasOwnProperty("email")) {
        // YES: Remove it
        delete listFilters.email;
        reloadList();
      }
      return;
    }

    if (!utilities.hasAsterisk(value)) {
      value = `*${value}*`;
    }

    // OPTIMIZATION: Single Asterisk is the same as no title filter
    if (value.length == 1 && value === "*") {
      // Do we have Title Filter Set?
      if (listFilters.hasOwnProperty("email")) {
        // YES: Remove it
        delete listFilters.email;
        reloadList();
      }
      return;
    }

    listFilters.email = value;
    reloadList();
  }

  // SVELTE MOUNT //
  onMount(() => {
    // Start with Reload
    reloadList(true);
  });
</script>

<section class={sectionClasses}>
  <h3 class="card-header d-flex">
    <div name="title" class="col text-center">{title}</div>
    <div name="actions" class="col-auto">
      <Button color="primary" on:click={(e) => onCreateInvite(e)}>
        <Icon name="plus-square" />
        <span class="d-none d-lg-inline">Invite</span>
      </Button>
    </div>
  </h3>
  <div class="card-header">
    <InputGroup>
      <InputGroupText>Filter</InputGroupText>
      <Input
        type="text"
        placeholder="Email Filter"
        aria-label="Email Filter"
        on:input={onBindEmail}
        bind:value={emailFilter}
      />
      <Button
        color="primary"
        name="filterOrg"
        on:click={(e) => onClearFilter(e)}
      >
        <Icon name="x" />
      </Button>
    </InputGroup>
  </div>
  <ul class="list-group list-group-flush">
    {#if hasPageUp(list)}
      <li class="list-group-item">
        <button
          type="button"
          class="btn btn-outline-secondary btn-no-outline w-100"
        >
          <i class="bi-arrow-bar-up text-primary" />
        </button>
      </li>
    {/if}
    {#each invitations as invitation}
      <li class="list-group-item d-flex">
        <div name="object" class="col align-self-center">
          <i class="bi-person" style="font-size: 1rem;" />
          {invitation.invitee}
        </div>
        <div name="actions" class="col-auto">
          <button
            name="deleteInvite"
            type="button"
            class="btn btn-outline-danger btn-no-outline"
          >
            <i class="bi-dash-circle" />
          </button>
        </div>
      </li>
    {/each}
    {#if hasPageDown(list)}
      <li class="list-group-item">
        <button
          type="button"
          class="btn btn-outline-secondary btn-no-outline w-100"
        >
          <i class="bi-arrow-bar-down text-primary" style="font-size: 1rem;" />
        </button>
      </li>
    {/if}
  </ul>
</section>
