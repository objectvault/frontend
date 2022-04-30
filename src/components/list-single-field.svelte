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
  import { onMount } from "svelte";

  // SVELTESTRAP //
  import { Button, Icon, Input, InputGroup, InputGroupText } from "sveltestrap";

  // Developer Libraries //
  import utilities from "../api/utilities";
  import type { TAction, CBActionHandler } from "../objects/actions";
  import __actions from "../objects/actions";
  import type { TSingleFieldList } from "../objects/single-field-list";
  import sflUtilities from "../objects/single-field-list";

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = "";

  // MODULE EXPORTS
  export { classes as class };
  export let list: TSingleFieldList;

  // LIST: Associated Objects
  let loaderList: any = null; // List Object Returned from Loader
  let entries: any[] = []; // Users Array
  //  let listFilters: any = {};
  let filterValue: string = "";
  let reloadTimeoutID: any = null;

  // Parameter Constants
  const filterTimeout: number = 500;

  // OBSERVERS
  $: sectionClasses = utilities.classes.merge("card", classes);
  $: listActions = getListActions(list);

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

  function getListActions(l: TSingleFieldList): TAction[] {
    const a: TAction[] = sflUtilities.listActions(l);
    a.push({
      id: "list.reload",
      icon: "arrow-counterclockwise",
      color: "primary",
      handler: async () => await reloadList(true),
      label: "Reload",
      tooltip: "Reload List",
    });

    return a;
  }

  function classesListActionButton(i: number, a: TAction): string {
    return i == 0 ? "" : "ms-1";
  }

  function classesEntryActionButton(i: number, a: TAction): string {
    const c: string = __actions.actionColor(a, "primary");
    const cl: string = `btn btn-outline-${c} btn-no-outline`;
    return i === 0 ? cl : cl + " ps-1";
  }

  async function reloadEntries(): Promise<any> {
    try {
      // Reload Entries
      let l: any = list.loader != null ? await list.loader() : null;

      if (l != null) {
        loaderList = l;
        entries = l.items ? l.items : [];
      }

      if (entries.length == 0) {
        console.log("List has No Entries");
      }

      return true;
    } catch (e) {
      throw e;
    }
  }

  async function reloadList(immed = false): Promise<any> {
    // Do we have Timer Set?
    if (reloadTimeoutID != null) {
      // YES: Clear it
      clearTimeout(reloadTimeoutID);
      reloadTimeoutID = null;
    }

    // Call Immediately?
    if (!immed) {
      // NO: Delay Call
      reloadTimeoutID = setTimeout(() => reloadEntries(), filterTimeout);
      return null;
    }

    return await reloadEntries();
  }

  // EVENTS //
  function onClearFilterValue(e: Event) {
    filterValue = "";

    // Do we have Title Filter Set?
    if (list.filter.has()) {
      // YES: Remove it
      list.filter.clear();
      reloadList();
    }
  }

  function onBindFilterValue(e: InputEvent) {
    const source: string = (e.target as any).value;
    let value: string = source;

    // Cleanup Value
    value = sflUtilities.filterNormalize(list, value);

    // Does it match current input?
    if (value.length != source.length || value !== source) {
      // NO: Update Current Input
      filterValue = value;
    }

    // Do we have a value for Filter?
    if (value.length === 0) {
      // NO: Do we have a Filter Set?
      if (list.filter.has()) {
        // YES: Remove it
        list.filter.clear();
        reloadList();
      }
      return;
    }

    if (!utilities.hasAsterisk(value)) {
      value = `*${value}*`;
    }

    // OPTIMIZATION: Single Asterisk is the same as no filter
    if (value.length == 1 && value === "*") {
      // Do we have Title Filter Set?
      if (list.filter.has()) {
        // YES: Remove it
        list.filter.clear();
        reloadList();
      }
      return;
    }

    list.filter.set(value);
    reloadList();
  }

  function onListAction(e: Event, a: TAction) {
    // Stop Default Processing
    e.preventDefault();

    const h: CBActionHandler = __actions.actionHandler(a, () =>
      console.info(`NO HANDLER: Clicked [${a.id}]`)
    );

    if (h !== null) {
      a.__reloadList = reloadList;
      h(a);
    }
  }

  function onEntryAction(e: Event, a: TAction, entry: any) {
    const h: CBActionHandler = __actions.actionHandler(a, () =>
      console.info(`NO HANDLER: Clicked [${a.id}] on [${list.entry.id(entry)}]`)
    );

    if (h !== null) {
      h(a, entry);
    }
  }

  // SVELTE MOUNT //
  onMount(() => {
    // Add Function to Reload List
    list.reloader = async (immed: boolean) => await reloadList(!!immed);

    // Start with Reload
    reloadList(true);
  });
</script>

<section class={sectionClasses}>
  <h3 class="card-header d-flex">
    <div name="title" class="col text-center">
      {sflUtilities.title(list)}
    </div>
    {#if listActions.length > 0}
      <div name="actions" class="col-auto">
        {#each listActions as action, i}
          {#if __actions.isActionDisplayed(action)}
            <Button
              name={action.id}
              color={__actions.actionColor(action, "primary")}
              class={classesListActionButton(i, action)}
              disabled={__actions.isActionDisabled(action)}
              on:click={(e) => onListAction(e, action)}
            >
              <Icon
                name={__actions.actionIcon(action, "patch-question-fill")}
              />
              <span class="d-none d-lg-inline"
                >{__actions.label(action, "")}</span
              >
            </Button>
          {/if}
        {/each}
      </div>
    {/if}
  </h3>
  {#if sflUtilities.displayFilter(list)}
    <div class="card-header">
      <InputGroup>
        <InputGroupText>
          {sflUtilities.filterTitle(list, "Filter")}
        </InputGroupText>
        <Input
          type="text"
          placeholder={sflUtilities.filterPlaceHolder(list, "Filter")}
          aria-label={sflUtilities.filterPlaceHolder(list, "Filter")}
          on:input={onBindFilterValue}
          bind:value={filterValue}
        />
        <Button
          color="primary"
          name="filterOrg"
          on:click={(e) => onClearFilterValue(e)}
        >
          <Icon name="x" />
        </Button>
      </InputGroup>
    </div>
  {/if}
  <ul class="list-group list-group-flush">
    {#if hasPageUp(loaderList)}
      <li class="list-group-item">
        <button
          type="button"
          class="btn btn-outline-secondary btn-no-outline w-100"
        >
          <i class="bi-arrow-bar-up text-primary" />
        </button>
      </li>
    {/if}
    {#each entries as entry}
      <li class="list-group-item d-flex">
        <div
          name={list.entry.id(entry)}
          class="col align-self-center text-warning"
        >
          <Icon name={list.entry.icon(entry)} />
          <span class="text-secondary">{list.entry.value(entry)}</span>
        </div>
        <div name="actions" class="col-auto">
          {#each sflUtilities.entryActions(list, entry) as action, i}
            {#if __actions.isActionDisplayed(action)}
              <Button
                name={action.id}
                color={__actions.actionColor(action, "primary")}
                outline={true}
                class="border-0"
                disabled={__actions.isActionDisabled(action)}
                on:click={(e) => onEntryAction(e, action, entry)}
              >
                <Icon name={__actions.actionIcon(action)} />
              </Button>
            {/if}
          {/each}
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
