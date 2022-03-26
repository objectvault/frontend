/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Components: LAYOUTS //
import NoSessionLayout from './layouts/no-session.svelte'
import SessionLayout from './layouts/session.svelte'
import InvitationLayout from './layouts/invitation.svelte'

// Components: PAGES //
import StartPage from './pages/enter.svelte'
import ExitPage from './pages/leave.svelte'
import HomePage from './pages/home.svelte'
import InvitationPage from './pages/invitation.svelte'
import OrgHomePage from './pages/org/home.svelte'
import OrgAdminPage from './pages/org/admin.svelte'
import StoreHomePage from './pages/store/home.svelte'
import StoreAdminPage from './pages/store/admin.svelte'

const routes: any = {
  "/": {
    _route: true,
    wrapper: NoSessionLayout,
    component: StartPage,
    props: {
      title: "ObjectVault: Welcome"
    }
  },
  "/invitation/:uid": {
    _route: true,
    wrapper: InvitationLayout,
    component: InvitationPage,
    props: {
      title: "ObjectVault: Invitation"
    }
  },
  "/exit": {
    _route: true,
    wrapper: NoSessionLayout,
    component: ExitPage,
    props: {
      title: "ObjectVault: Thank you!"
    }
  },
  "/home": {
    _route: true,
    wrapper: SessionLayout,
    component: HomePage
  },
  "/org/:org": {
    _route: true,
    wrapper: SessionLayout,
    component: OrgHomePage
  },
  "/admin/org/:org": {
    _route: true,
    wrapper: SessionLayout,
    component: OrgAdminPage
  },
  "/store/:store": {
    _route: true,
    wrapper: SessionLayout,
    component: StoreHomePage
  },
  "/admin/store/:store": {
    _route: true,
    wrapper: SessionLayout,
    component: StoreAdminPage
  },
};

export default routes;
