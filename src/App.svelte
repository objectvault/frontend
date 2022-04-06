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
  // SVELTE Routing without Sapper
  import Router from "svelte-spa-router";

  // SPA Routes
  import routes from "./routes";
</script>

<Router {routes} />

<style global lang="scss">
  // Import Bootstrap Icons
  @import "../node_modules/bootstrap-icons/font/bootstrap-icons";

  // Custom BOOTSTRAP Build //
  // Option B: Include parts of Bootstrap

  // 1. Include functions first (so you can manipulate colors, SVGs, calc, etc)
  @import "../node_modules/bootstrap/scss/functions";

  // 2. Include any default variable overrides here

  // 3. Include remainder of required Bootstrap stylesheets
  @import "../node_modules/bootstrap/scss/variables";
  @import "../node_modules/bootstrap/scss/mixins";
  @import "../node_modules/bootstrap/scss/utilities";

  // 4. Include any optional Bootstrap components as you like
  @import "../node_modules/bootstrap/scss/root";
  @import "../node_modules/bootstrap/scss/reboot";
  @import "../node_modules/bootstrap/scss/type";
  @import "../node_modules/bootstrap/scss/images";
  @import "../node_modules/bootstrap/scss/containers";
  @import "../node_modules/bootstrap/scss/grid";
  @import "../node_modules/bootstrap/scss/tables";
  @import "../node_modules/bootstrap/scss/forms";
  @import "../node_modules/bootstrap/scss/buttons";
  @import "../node_modules/bootstrap/scss/transitions";
  @import "../node_modules/bootstrap/scss/dropdown";
  @import "../node_modules/bootstrap/scss/button-group";
  @import "../node_modules/bootstrap/scss/nav";
  @import "../node_modules/bootstrap/scss/navbar";
  @import "../node_modules/bootstrap/scss/card";
  @import "../node_modules/bootstrap/scss/accordion";
  @import "../node_modules/bootstrap/scss/breadcrumb";
  @import "../node_modules/bootstrap/scss/pagination";
  @import "../node_modules/bootstrap/scss/badge";
  @import "../node_modules/bootstrap/scss/alert";
  @import "../node_modules/bootstrap/scss/progress";
  @import "../node_modules/bootstrap/scss/list-group";
  @import "../node_modules/bootstrap/scss/close";
  @import "../node_modules/bootstrap/scss/toasts";
  @import "../node_modules/bootstrap/scss/modal";
  @import "../node_modules/bootstrap/scss/tooltip";
  @import "../node_modules/bootstrap/scss/popover";
  @import "../node_modules/bootstrap/scss/carousel";
  @import "../node_modules/bootstrap/scss/spinners";
  @import "../node_modules/bootstrap/scss/offcanvas";

  // Helpers
  @import "../node_modules/bootstrap/scss/helpers";

  // Utilities
  @import "../node_modules/bootstrap/scss/utilities/api";

  // 5. Add additional custom code here

  body {
    --tw-text-opacity: 1;
    color: rgba(55, 65, 81, var(--tw-text-opacity));

    --tw-bg-opacity: 1;
    background-color: rgba(146, 64, 14, var(--tw-bg-opacity));
  }

  // Don't Display an Outline on Buttons
  .btn-no-outline {
    border-color: transparent !important;
  }
</style>
