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
  import utilities from "../api/utilities";

  // LOADER Definition
  type TLoader = (filter: string) => Promise<any>;

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = "";

  // MODULE EXPORTS
  export { classes as class };
  export let objectID: string;
  export let title: string = "Users";
  export let loader: TLoader;

  // LIST: Associated Objects
  let list: any = null; // List of Object Users
  let users: any[] = []; // Users Array
  let listFilters: any = {};
  let userNameFilter: string = "";
  let filterTimeoutID: any = null;

  // Parameter Constants
  const filterTimeout: number = 500;

  // OBSERVERS
  $: sectionClasses = utilities.classes.merge("card", classes);

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
    for (const key of ["username"]) {
      if (!listFilters.hasOwnProperty(key)) {
        continue;
      }

      switch (key) {
        case "username":
          filters.push(`contains(username, "${listFilters.username}")`);
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

  async function reloadUsers(): Promise<any> {
    try {
      // Reload Invitations List
      const filter: string = generateObjectFilter();
      let l: any = loader != null ? await loader(filter) : null;

      if (l != null) {
        list = l;
        users = l.items ? l.items : [];
      }

      if (users.length == 0) {
        console.log("Object has No Users");
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
      filterTimeoutID = setTimeout(() => reloadUsers(), filterTimeout);
      return null;
    }

    return await reloadUsers();
  }
  // EVENTS //
  async function onReloadList(e: Event) {
    // Stop Default Processing
    e.preventDefault();

    // Reload User List
    return await reloadList(true);
  }

  function onClearFilter(e: Event) {
    userNameFilter = "";

    // NO: Do we have Title Filter Set?
    if (listFilters.hasOwnProperty("username")) {
      // YES: Remove it
      delete listFilters.username;
      reloadList();
    }
  }

  function onBindUserName(e: InputEvent) {
    const source: string = (e.target as any).value;
    let value: string = source;

    // Cleanup Value
    value = value.trim().toLowerCase();

    // Does it match current input?
    if (value.length != source.length || value != source) {
      // NO: Update Current Input
      userNameFilter = value;
    }

    // Do we have a value for Title Filter?
    if (value.length === 0) {
      // NO: Do we have Title Filter Set?
      if (listFilters.hasOwnProperty("username")) {
        // YES: Remove it
        delete listFilters.username;
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
      if (listFilters.hasOwnProperty("username")) {
        // YES: Remove it
        delete listFilters.username;
        reloadList();
      }
      return;
    }

    listFilters.username = value;
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
      <Button
        name="reload-list"
        color="primary"
        on:click={(e) => onReloadList(e)}
      >
        <Icon name="arrow-counterclockwise" />
        <span class="d-none d-lg-inline">Reload</span>
      </Button>
    </div>
  </h3>
  <div class="card-header">
    <InputGroup>
      <InputGroupText>Filter</InputGroupText>
      <Input
        type="text"
        placeholder="User Name Filter"
        aria-label="USer Name Filter"
        on:input={onBindUserName}
        bind:value={userNameFilter}
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
    {#each users as user}
      <li class="list-group-item d-flex">
        <div name={user.user} class="col align-self-center text-warning">
          <i class="bi-person-fill" style="font-size: 1rem;" />
          <span class="text-secondary">{user.username}</span>
        </div>
        <div name="actions" class="col-auto">
          <button
            name="editUserPermissions"
            type="button"
            class="btn btn-outline-primary btn-no-outline px-1"
          >
            <i class="bi-pencil" />
          </button>
          <button
            name="deleteUser"
            type="button"
            class="btn btn-outline-danger btn-no-outline px-1"
          >
            <i class="bi-dash-circle" />
          </button>
          <button
            name="resetUserState"
            type="button"
            class="btn btn-outline-warning btn-no-outline px-1"
          >
            <i class="bi-arrow-counterclockwise" />
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
