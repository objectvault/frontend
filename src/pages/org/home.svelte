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
  import { onDestroy } from "svelte";

  // ROUTING //
  import { replace } from "svelte-spa-router";

  // STORES //
  import sessionUser from "../../stores/session-user";
  import actionsStore from "../../stores/taskbar-actions";
  import notifyStore from "../../stores/notify";

  // WebServices API Library //
  import apiOrg from "../../api/org";
  import apiOrgUser from "../../api/org/org-user";
  import apiRoles from "../../api/roles";

  // Developer Libraries //
  import EventEmitter from "../../api/event-emitter";
  import type { User } from "../../classes/user";
  import { Organization } from "../../classes/organization";
  import { OrganizationUser } from "../../classes/organization-user";
  import type { TAction } from "../../objects/actions";

  // CUSTOM Components //
  import Overlay from "../../components/overlay.svelte";
  import Spinner from "../../components/spinner.svelte";

  // Component Paramters //
  export let params: any = {}; // IN: Router - Route Parameters

  // COMPONENT Bindable Paramters//
  let spinner: boolean = true;
  let organization: Organization = null; // Organization Object
  let organizationUser: OrganizationUser = null; // Registry: Organization Session User Registry
  let user: User = null;
  let listOfStores: any = null; // List Object Returned from API
  let stores: any[] = []; // Stores Array

  // Reactive Stores //
  $: notifyPopUp = $notifyStore;

  // DEBUG //
  $: console.log(params);

  // EVENTS //
  function onClickLogout(a: TAction) {
    EventEmitter.emit("do-logout");
  }

  // HELPERS //
  function notify(n: any) {
    if (notifyPopUp) {
      (notifyPopUp as any)(n);
      return;
    }

    console.log(n);
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

  async function loadOrganization(id: string): Promise<Organization> {
    const r: any = await apiOrg.get(id);
    const org: Organization = new Organization(r);
    return org;
  }

  async function loadOrganizationUser(
    org: string,
    user: string
  ): Promise<OrganizationUser> {
    const r: any = await apiOrgUser.get(org, user);
    const ou: OrganizationUser = new OrganizationUser(r);
    return ou;
  }

  async function reloadStores(id: string): Promise<any> {
    // Reload Stores List
    const list: any = await apiOrg.stores.list(id);
    if (list != null) {
      stores = list.items ? list.items : [];
    }

    if (stores.length == 0) {
      notify("Organization has No Stores");
    }

    return list;
  }

  // Page Initialization //
  async function start(): Promise<boolean> {
    console.log("start: org\\home.svelte");

    try {
      const id: string = params.org;

      // TODO: Add Spinner
      organization = await loadOrganization(id);
      organizationUser = await loadOrganizationUser(id, user.id());

      // Is System Organization?
      if (!organization.isSystem()) {
        // NO: Has Store List Access?
        if (
          organizationUser &&
          organizationUser
            .roles()
            .hasRole(
              apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_STORE,
              apiRoles.FUNCTION_LIST
            )
        ) {
          // YES: Load Stores
          try {
            listOfStores = await reloadStores(id);
          } catch (e) {
            notify("Failed to Load Stores List");
            notify(e.toString());
            listOfStores = null;
          }
        } else {
          listOfStores = null;
        }
      } else {
        // YES: Redirect to Admin Page
        replace(`/admin/org/${params.org}`);
      }

      spinner = false;
      return true;
    } catch (e) {
      setTimeout(() => (spinner = false), 1000);
      notify(e.toString());
      return false;
    }
  }

  const unsubscribe = sessionUser.subscribe((u: any) => {
    // Set Current Session User
    user = u;

    // Do we have a Session User?
    if (u != null) {
      // YES: Initialize Page
      start();

      // Add Logout Action
      actionsStore.set([
        {
          id: "logout",
          icon: "box-arrow-left",
          label: "Leave",
          handler: onClickLogout,
        },
      ]);
    }
  });

  // LIFE CYCLE //
  onDestroy(unsubscribe);
</script>

<svelte:head>
  <title>ObjectVault - Organization [{params.org}]</title>
</svelte:head>

<main class="container">
  {#if spinner}
    <Overlay>
      <Spinner />
    </Overlay>
  {/if}

  {#if user && organization}
    <div class="card mb-3">
      <h3 class="card-header d-flex">
        <div class="col">{organization.alias()}</div>
        <div name="actions" class="col-auto">
          {#if (organization.state() & 0xfff) == 0}
            <a
              id="editOrganization"
              href="#/admin/org/{params.org}"
              class="btn btn-warning"
              role="button"
            >
              <i class="bi-pencil" />
              <span class="d-none d-md-inline">Edit</span>
            </a>
          {/if}
        </div>
      </h3>
      <div class="card-body">
        {organization.name() != null ? organization.name() : ""}
      </div>
    </div>
    {#if !organization.isSystem() && listOfStores != null}
      <div class="card">
        <h3 class="card-header text-center">Stores</h3>
        <div class="card-header">
          <div class="d-flex flex-column pt-2">
            <div class="d-flex">
              <div class="input-group">
                <button
                  type="button"
                  class="btn btn-primary dropdown-toggle"
                  id="dropdown"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span class="align-text-bottom d-none d-sm-inline">Size:</span
                  >
                  <span class="align-text-bottom">10</span>
                </button>
                <div class="dropdown-menu" aria-labelledby="pageSize">
                  <a href="#" class="dropdown-item">5</a>
                  <a href="#" class="dropdown-item active">10</a>
                  <a href="#" class="dropdown-item">100</a>
                  <a href="#" class="dropdown-item">All</a>
                </div>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Search text here"
                  aria-label="Text input with dropdown"
                />
                <button type="button" class="btn btn-primary" id="buttonAfter">
                  <i class="bi-search" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <ul class="list-group list-group-flush">
          {#if hasPageUp(listOfStores)}
            <li class="list-group-item">
              <button
                type="button"
                class="btn btn-outline-secondary btn-no-outline w-100"
              >
                <i class="bi-arrow-bar-up text-primary" />
              </button>
            </li>
          {/if}
          {#each stores as store}
            <li class="list-group-item d-flex">
              <div class="col">
                <i class="bi-sd-card-fill" />
                <a
                  href="#/store/{store.store}"
                  class="link-secondary text-decoration-none">{store.alias}</a
                >
              </div>
              <div class="col-auto">
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-no-outline"
                >
                  <i class="bi-star text-primary" />
                </button>
              </div>
            </li>
          {/each}
          {#if hasPageDown(listOfStores)}
            <li class="list-group-item">
              <button
                type="button"
                class="btn btn-outline-secondary btn-no-outline w-100"
              >
                <i
                  class="bi-arrow-bar-down text-primary"
                  style="font-size: 1rem;"
                />
              </button>
            </li>
          {/if}
        </ul>
      </div>
    {/if}
  {/if}
</main>
