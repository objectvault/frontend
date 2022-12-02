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

  // Other Libraries //
  import _ from "lodash";

  // WebServices API Library //
  import apiMe from "../../api/me";
  import apiOrg from "../../api/org";
  import apiOrgUser from "../../api/org/org-user";
  import apiRoles from "../../api/roles";

  // Developer Libraries //
  import EventEmitter from "../../api/event-emitter";
  import type { User } from "../../classes/user";
  import { Organization } from "../../classes/organization";
  import { OrganizationUser } from "../../classes/organization-user";
  import { OrganizationStore } from "../../classes/organization-store";
  import type { TAction } from "../../objects/actions";
  import type { TSingleFieldList } from "../../objects/single-field-list";

  // CUSTOM Components //
  import Overlay from "../../components/overlay.svelte";
  import Spinner from "../../components/spinner.svelte";
  import SingleFieldExplorer from "../../components/list-single-field.svelte";
  import sflUtilities from "../../objects/single-field-list";

  // Component Paramters //
  export let params: any = {}; // IN: Router - Route Parameters

  // COMPONENT Bindable Paramters//
  let spinner: boolean = true;
  let organization: Organization = null; // Organization Object
  let organizationUser: OrganizationUser = null; // Registry: Organization Session User Registry
  let user: User = null;

  // Reactive Stores //
  $: notifyPopUp = $notifyStore;

  // Reactive Statements //
  $: sflListStores = sflStoresCreate(params.org);

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

  // START: SINGLE FIELD LIST - Stores //
  function sflStoresCreate(org: string): TSingleFieldList {
    // Create Basic SFL Object
    const l: TSingleFieldList = {
      listActions: null,
      header: {
        title: "Stores",
      },
      filter: sflUtilities.standardFilterObject(
        "alias",
        null,
        "Filter by Alias"
      ),
      entry: sflUtilities.standardEntryObject(
        "store",
        "storename",
        "sd-card-fill",
        (os: OrganizationStore): string => `#/store/${os.store()}`
      ),
      entryActions: null,
      loader: null,
    };

    /* TODO: Add Entry Action to Toggle Store as Favorite (or not)
     * Requires Sinbgle Field Explorer to have Entry Actions with Set State
     * (i.e. if you change the stae the icon / text changes)
     */
    // Create Loader
    l.loader = async (): Promise<any> => {
      let fv: string = l.filter.get();
      let list: any = null;
      if (fv.length) {
        const filter: string = `contains(alias, "${fv}")`;
        list = await apiOrg.stores.list(org, {
          filter,
        });
      } else {
        list = await apiOrg.stores.list(org);
      }

      // Map List Items
      list.items = list.items.map((i: any) => new OrganizationStore(i));

      if (list.items.length == 0) {
        notify("Organization has No Stores");
      }

      return list;
    };
    return l;
  }
  // END: SINGLE FIELD LIST - Stores //

  // Page Initialization //
  async function start(): Promise<boolean> {
    console.log("start: org\\home.svelte");

    try {
      const id: string = params.org;

      // TODO: Add Spinner
      organization = await loadOrganization(id);
      organizationUser = await loadOrganizationUser(id, user.id());

      // Is System Organization?
      if (organization.isSystem()) {
        // YES: Redirect to Admin Page
        replace(`/admin/org/${params.org}`);
      }

      spinner = false;
      return true;
    } catch (e) {
      setTimeout(() => (spinner = false), 500);
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
    <div class="row mb-3">
      <div class="card p-0">
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
    </div>
    {#if !organization.isSystem() && organizationUser}
      {#if organizationUser
        .roles()
        .hasRole(apiRoles.CATEGORY_ORG | apiRoles.SUBCATEGORY_STORE, apiRoles.FUNCTION_LIST)}
        <div class="row">
          <SingleFieldExplorer list={sflListStores} class="col-12 p-0" />
        </div>
      {/if}
    {/if}
  {/if}
</main>
