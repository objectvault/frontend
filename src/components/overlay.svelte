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

  import { createEventDispatcher } from "svelte";

  // Default Z-INDEX
  export let zIndex: number = 10;

  // Custom Event
  const dispatch = createEventDispatcher();
  function onClick() {
    dispatch("click-overlay");
  }
</script>

<div class="overlay" style="z-index: {zIndex}" on:click={onClick}>
  <div class="content-container">
    <div class="content">
      <slot />
    </div>
  </div>
</div>

<style>
  .overlay {
    /* TAKE OVER FULL SCREEN */
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* ADD SHADOW */
    background-color: rgba(0, 0, 0, 0.5);
  }

  .content-container {
    position: relative;
    /* HAVE TO SET WIDTH AND HEIGHT so CONTENT CONTAINER OCCUPIES ALL OF
     * PARENTS SPACE
     */
    width: 100%;
    height: 100%;
  }

  .content {
    z-index: 20;
    /* CENTER TOP LEFT CORNER OF CONTENT */
    position: absolute;
    top: 50%;
    left: 50%;
    /* REPOSITION TO CENTER OF ELEMENT */
    transform: translate(-50%, -50%);
  }
</style>
