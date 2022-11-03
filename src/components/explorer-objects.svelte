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

  // TODO: Disable on focus border for buttons

  // SVELTE API //
  import { onMount, createEventDispatcher } from "svelte";

  // SVELTESTRAP //
  import { Button, Icon, Input, InputGroup } from "sveltestrap";

  // Developer Libraries //
  import apiMe from "../api/me";
  import utilities from "../api/utilities";

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = "";

  // LIST: Associated Objects
  let list: any = null;
  let objects: any[] = [];
  let listFilters: any = {};
  let filterToggleColors: any = {
    favorite: "secondary",
    org: "secondary",
    store: "secondary",
  };
  let titleFilter: string = "";
  let filterTimeoutID: any = null;

  // Parameter Constants
  const filterTimeout: number = 500;

  // MODULE EXPORTS
  export { classes as class };

  // OBSERVERS
  $: sectionClasses = utilities.classes.merge("card", classes);

  // SVELTE: Event Dispatcher
  const dispatch = createEventDispatcher();

  // HELPERS //
  function iconFavorite(link: any): string {
    return link.favorite ? "star-fill" : "star";
  }

  function iconObjectType(link: any): string {
    switch (link.type) {
      case 2:
        return "building";
      case 3:
        return "sd-card-fill";
      default:
        return "question-diamond-fill";
    }
  }

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
    for (const key of ["favorite", "alias", "type"]) {
      if (!listFilters.hasOwnProperty(key)) {
        continue;
      }

      switch (key) {
        case "alias":
          filters.push(`contains(alias, "${listFilters.alias}")`);
          break;
        case "favorite":
          filters.push(`eq(favorite, ${listFilters.favorite ? 1 : 0})`);
          break;
        case "type":
          filters.push(`eq(type, ${listFilters.type})`);
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

  async function reloadObjects(): Promise<any> {
    const filter: string = generateObjectFilter();
    // Get List of Filtered Associated Objects
    const fs: any = await apiMe.objects.list({ filter });
    if (fs != null) {
      list = fs;
      objects = list.items ? list.items : [];
      return fs;
    }

    console.log("No Associated Objects");
    return null;
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
      filterTimeoutID = setTimeout(() => reloadObjects(), filterTimeout);
      return null;
    }

    return await reloadObjects();
  }

  // EVENT Handlers //
  async function onToggleExplorerFavorite(f: any) {
    try {
      console.log(f);
      const link: any = await apiMe.favorites.toggle(f.object);
      console.log(link);
      if (link) {
        reloadList();
      }
      return link;
    } catch (e) {
      // handle error
      console.error(e.toString());
      return null;
    }
  }

  async function onToggleFilter(e: PointerEvent, toggle: string) {
    // Stop Further Processing
    e.preventDefault();

    switch (toggle) {
      case "favorite":
        if (listFilters.hasOwnProperty("favorite")) {
          delete listFilters.favorite;
          filterToggleColors.favorite = "secondary";
        } else {
          listFilters.favorite = 1;
          filterToggleColors.favorite = "primary";
        }
        break;
      case "org":
        if (listFilters.hasOwnProperty("type")) {
          if (listFilters.type == 2) {
            delete listFilters.type;
            filterToggleColors.org = "secondary";
          } else {
            listFilters.type = 2;
            filterToggleColors.org = "primary";
            filterToggleColors.store = "secondary";
          }
        } else {
          listFilters.type = 2;
          filterToggleColors.org = "primary";
        }
        break;
      case "store":
        if (listFilters.hasOwnProperty("type")) {
          if (listFilters.type == 3) {
            delete listFilters.type;
            filterToggleColors.store = "secondary";
          } else {
            listFilters.type = 3;
            filterToggleColors.store = "primary";
            filterToggleColors.org = "secondary";
          }
        } else {
          listFilters.type = 3;
          filterToggleColors.store = "primary";
        }
        break;
    }

    // Update List
    await reloadList();

    // Update Button Colors
    filterToggleColors = filterToggleColors;
  }

  function onClickLink(e: Event, o: any) {
    // Stop Default Processing
    e.preventDefault();

    // Notify of Click
    dispatch("click-object", o);
  }

  function onBindAlias(e: InputEvent) {
    const source: string = (e.target as any).value;
    let value: string = source;

    // Cleanup Value
    value = value.trim().toLowerCase();

    // Does it match current input?
    if (value.length != source.length || value != source) {
      // NO: Update Current Input
      titleFilter = value;
    }

    // Do we have a value for Title Filter?
    if (value.length === 0) {
      // NO: Do we have Title Filter Set?
      if (listFilters.hasOwnProperty("title")) {
        // YES: Remove it
        delete listFilters.title;
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
      if (listFilters.hasOwnProperty("title")) {
        // YES: Remove it
        delete listFilters.title;
        reloadList();
      }
      return;
    }

    listFilters.title = value;
    reloadList();
  }

  // SVELTE MOUNT //
  onMount(() => {
    // Start with Reload
    reloadList(true);
  });
</script>

<section class={sectionClasses}>
  <h3 class="card-header text-center">Explorer</h3>
  <div class="card-header">
    <InputGroup>
      <button
        type="button"
        class="btn btn-primary dropdown-toggle"
        id="dropdown"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span class="align-text-bottom d-not-sm-none">Size:</span>
        <span class="align-text-bottom">10</span>
      </button>
      <div class="dropdown-menu" aria-labelledby="pageSize">
        <a href="#" class="dropdown-item active">5</a>
        <a href="#" class="dropdown-item">10</a>
        <a href="#" class="dropdown-item">100</a>
        <a href="#" class="dropdown-item">All</a>
      </div>
      <Input
        type="text"
        placeholder="Search text here"
        aria-label="Text input with dropdown"
        on:input={onBindAlias}
        bind:value={titleFilter}
      />
      <Button
        color={filterToggleColors.org}
        name="filterOrg"
        on:click={(e) => onToggleFilter(e, "org")}
      >
        <Icon name="building" />
      </Button>
      <Button
        color={filterToggleColors.store}
        name="filterStore"
        on:click={(e) => onToggleFilter(e, "store")}
      >
        <Icon name="sd-card-fill" />
      </Button>
      <Button
        color={filterToggleColors.favorite}
        name="filterFavourite"
        on:click={(e) => onToggleFilter(e, "favorite")}
      >
        <Icon name="star-fill" />
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
          <i class="bi-arrow-bar-up text-primary" style="font-size: 1rem;" />
        </button>
      </li>
    {/if}
    {#each objects as o}
      <li class="list-group-item d-flex">
        <div class="col">
          <Icon name={iconObjectType(o)} />
          <a
            href="#/"
            class="link-secondary text-decoration-none"
            on:click={(e) => onClickLink(e, o)}
          >
            {o.alias}
          </a>
        </div>
        <div class="col-auto">
          <Button
            color="primary"
            outline
            class="py-0 btn-no-outline"
            on:click={() => onToggleExplorerFavorite(o)}
          >
            <Icon name={iconFavorite(o)} />
          </Button>
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
