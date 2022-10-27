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
  import { createEventDispatcher } from "svelte";

  // SVELTESTRAP //
  import {
    Button,
    Form,
    FormGroup,
    Icon,
    Input,
    InputGroup,
  } from "sveltestrap";

  // Application LIBRARIES //
  import utilities from "../../api/utilities";

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let _classes: string = null;

  // MODULE EXPORTS
  export { _classes as class };
  export let password: string = ""; // Default Value for Current Password

  // COMPONENT Bindable Parameters//
  let sCurrentPWD: string = password.trim();
  let bShowCurrentPWD: boolean = false;
  let bCurrenPWDInvalid: boolean = true;

  let sNewPWD: string = "";
  let bShowNewPWD: boolean = false;
  let bNewPWDInvalid: boolean = true;

  let sConfirmPWD: string = "";
  let bShowConfirmPWD: boolean = false;
  let bConfirmPWDInvalid: boolean = true;

  let bFormInvalid: boolean = false;

  let classes: string = "";
  let buttonColor: string = "primary";

  // OBSERVERS
  $: classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  $: buttonColor = bFormInvalid ? "primary" : "success";

  // REACTIVE Block
  $: {
    // Calculate Field Valid States
    bCurrenPWDInvalid = sCurrentPWD.length < 8;
    bNewPWDInvalid = sNewPWD.length < 8;
    bConfirmPWDInvalid =
      sConfirmPWD.length < 8 ||
      sConfirmPWD.length != sNewPWD.length ||
      sConfirmPWD != sNewPWD;

    // Calculate Form Valid State
    bFormInvalid =
      bCurrenPWDInvalid ||
      bNewPWDInvalid ||
      (bConfirmPWDInvalid && !bShowNewPWD);
  }

  // HELPERS //
  function reset() {
    sCurrentPWD = sNewPWD = sConfirmPWD = "";
    bShowCurrentPWD = bShowNewPWD = bShowConfirmPWD = false;
  }

  // EVENTS //
  function onShowPassword(e: PointerEvent, which: string) {
    // Stop Further Processing
    e.preventDefault();

    switch (which) {
      case "current":
        bShowCurrentPWD = !bShowCurrentPWD;
        break;
      case "new":
        bShowNewPWD = !bShowNewPWD;

        // Are we Showing the New Password?
        if (bShowNewPWD) {
          // YES: Clear Confirm Password
          sConfirmPWD = "";
        }
        break;
      case "confirm":
        bShowConfirmPWD = !bShowConfirmPWD;
        break;
    }
  }

  function onSubmitForm(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Dispatch Invite Click
    dispatch("formSubmit", {
      current: sCurrentPWD,
      new: sNewPWD,
      reset: reset,
    });
  }
</script>

<Form class={classes} role="form" autocomplete="off">
  <FormGroup>
    <label for="iCurrentPassword">Current Password</label>
    <InputGroup class="d-flex mb-1">
      <Input
        id="iCurrentPassword"
        type={bShowCurrentPWD ? "text" : "password"}
        class="col"
        placeholder="Current Password"
        aria-label="Current Password"
        required
        invalid={bCurrenPWDInvalid}
        bind:value={sCurrentPWD}
      />
      <Button
        class="col-auto input-group-text"
        tabindex={-1}
        on:click={(e) => onShowPassword(e, "current")}
      >
        <Icon name="eye" />
      </Button>
    </InputGroup>
  </FormGroup>
  <hr />
  <FormGroup>
    <label for="iNewPassword">New Password</label>
    <InputGroup class="d-flex mb-1">
      <Input
        id="iNewPassword"
        type={bShowNewPWD ? "text" : "password"}
        class="col"
        placeholder="New Password"
        aria-label="New Password"
        required
        invalid={bNewPWDInvalid}
        bind:value={sNewPWD}
      />
      <Button
        class="col-auto input-group-text"
        tabindex={-1}
        on:click={(e) => onShowPassword(e, "new")}
      >
        <Icon name="eye" />
      </Button>
    </InputGroup>
  </FormGroup>
  {#if !bShowNewPWD}
    <FormGroup>
      <label for="iConfirmPassword">Confirm</label>
      <InputGroup class="d-flex mb-1">
        <Input
          id="iConfirmPassword"
          type={bShowConfirmPWD ? "text" : "password"}
          class="col"
          placeholder="Confirm Password"
          aria-label="Confirm Password"
          required
          invalid={bConfirmPWDInvalid}
          bind:value={sConfirmPWD}
        />
        <Button
          class="col-auto input-group-text"
          tabindex={-1}
          on:click={(e) => onShowPassword(e, "confirm")}
        >
          <Icon name="eye" />
        </Button>
      </InputGroup>
    </FormGroup>
  {/if}
  <FormGroup>
    <Button
      type="submit"
      size="lg"
      class="float-right"
      color={buttonColor}
      disabled={bFormInvalid}
      on:click={onSubmitForm}>Save</Button
    >
  </FormGroup>
</Form>
