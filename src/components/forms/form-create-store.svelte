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
  // SVELTE //
  import { onMount } from "svelte";

  // SVELTE API //
  import { createEventDispatcher } from "svelte";

  // SVELTESTRAP //
  import {
    Button,
    Form,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
  } from "sveltestrap";

  // Application LIBRARIES //
  import utilities from "../../api/utilities";

  // TypeScript Types
  type TMessageMap = {
    [key: string]: string;
  };

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // TODO Exclude Offensive Words
  const patternAlias = /[a-z][a-z0-9_.-]{2,}/;

  // SPECIAL EXPORT - Treat classes as class attribute
  let _classes: string = null;

  // MODULE EXPORTS
  export { _classes as class };

  // COMPONENT Bindable Parameters//
  let sAlias: string = "";
  let bInvalidAlias: boolean = true;

  let sTitle: string = "";
  let bInvalidTitle: boolean = true;

  let sPassword: string = "";
  let bDisplayPassword: boolean = false;
  let bInvalidPassword: boolean = true;

  let bFormInvalid: boolean = false;

  let classes: string = "";
  let buttonColor: string = "primary";

  let messages: TMessageMap = {};
  let messageTimeout: number = null;

  // OBSERVERS //

  // Form Class
  $: classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "my-2")
  );

  // Submit Button Color
  $: buttonColor = bFormInvalid ? "primary" : "success";

  // Calculate Form Valid State
  $: bFormInvalid = bInvalidAlias || bInvalidTitle;

  // Helpers //
  function setMessage(k: string, m?: string) {
    let modified: boolean = false;
    let set: boolean = false;

    // Seeting a message?
    if (m == null) {
      // CLEARING: Is Message Set?
      if (messages.hasOwnProperty(k)) {
        delete messages[k];
        modified = true;
      }
    } else {
      // SETTING: Is Message Already Set?
      if (!messages.hasOwnProperty(k)) {
        messages[k] = m;
        modified = true;
        set = true;
      }
    }

    // Has the Messages Map been Modified?
    if (modified) {
      // Do we have a Timeout Event?
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }

      // Delay Message Dispatch
      messageTimeout = setTimeout(() => {
        let arMessages: string[] = [];
        let keys = Object.keys(messages).sort();
        for (const k of keys) {
          if (messages.hasOwnProperty(k)) {
            arMessages.push(messages[k]);
          }
        }

        // Disptach Form Messages
        dispatch("formMessages", arMessages.length ? arMessages : null);
      }, 200);
    }

    return set;
  }

  function validateAlias() {
    bInvalidAlias = setMessage(
      "alias-require",
      sAlias.length == 0 ? "ALIAS: Missing" : null
    );
    if (!bInvalidAlias) {
      bInvalidAlias ||= setMessage(
        "alias-min",
        sAlias.length < 8 ? "ALIAS: Minimum Length is 8" : null
      );
      bInvalidAlias ||= setMessage(
        "alias-pattern",
        !patternAlias.test(sAlias) ? "ALIAS: Invalid Value" : null
      );
    }
  }

  function validateTitle() {
    bInvalidTitle = setMessage(
      "title-require",
      sTitle.length == 0 ? "TITLE: Missing" : null
    );
    if (!bInvalidTitle) {
      bInvalidTitle ||= setMessage(
        "title-min",
        sTitle.length < 4 ? "TITLE: Minimum Length is 4" : null
      );
    }
  }

  function validatePassword() {
    bInvalidPassword = setMessage(
      "password-require",
      sPassword.length == 0 ? "PASSWORD: Empty" : null
    );
    if (!bInvalidPassword) {
      bInvalidPassword ||= setMessage(
        "password-empty",
        sPassword.trim().length == 0
          ? "PASSWORD: Contains only whitespaces"
          : null
      );
      bInvalidPassword ||= setMessage(
        "password-min",
        sPassword.length < 8 ? "PASSWORD: Minimum Length is 8" : null
      );
    }
  }

  // EVENTS //
  function onKeyDownNoSpace(e: KeyboardEvent) {
    if (e.code === "Space") {
      e.preventDefault();
    }
  }

  function onInputAlias(e: InputEvent) {
    // SPECIAL CONSIDERATION: Pasted Input
    sAlias = (e.target as any).value;
    sAlias = sAlias.trim().replaceAll(/\s/g, "");
    validateAlias();
  }

  function onInputTitle(e: InputEvent) {
    // SPECIAL CONSIDERATION: Pasted Input
    sTitle = (e.target as any).value;
    sTitle = sTitle.trim();
    //    sTitle = sTitle.trim().replaceAll(/[\t\r\n\v\f]/g, " ");

    validateTitle();
  }

  function onInputPassword(e: InputEvent) {
    // SPECIAL CONSIDERATION: Pasted Input
    sPassword = (e.target as any).value;

    validatePassword();
  }

  function onToggleDisplayPassword(e: Event) {
    e.preventDefault();

    bDisplayPassword = !bDisplayPassword;
  }

  function onSubmitForm(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Dispatch Invite Click
    dispatch("formSubmit", {
      alias: sAlias,
      title: sTitle,
      password: sPassword,
    });
  }

  // LIFECYCLE MANAGEMENT //
  onMount(() => {
    validateAlias();
    validateTitle();
    validatePassword();
  });
</script>

<Form id="formCreateStore" class={classes} on:submit={onSubmitForm}>
  <InputGroup class="d-flex mb-2">
    <InputGroupText class="col-3">Alias</InputGroupText>
    <Input
      type="text"
      name="store-alias"
      placeholder="Store Alias"
      minlength="8"
      maxlength="40"
      on:keydown={onKeyDownNoSpace}
      on:input={onInputAlias}
      value={sAlias}
      required
      invalid={bInvalidAlias}
    />
  </InputGroup>
  <InputGroup class="d-flex mb-3">
    <InputGroupText class="col-3">Title</InputGroupText>
    <Input
      type="text"
      name="store-title"
      placeholder="Store Title"
      minlength="4"
      maxlength="80"
      on:input={onInputTitle}
      value={sTitle}
      required
      invalid={bInvalidTitle}
    />
  </InputGroup>
  <InputGroup class="d-flex mb-3">
    <InputGroupText class="col-3">Your Password</InputGroupText>
    <Input
      type={bDisplayPassword ? "text" : "password"}
      name="user-password"
      class="col"
      placeholder="Your Password"
      minlength="8"
      on:input={onInputPassword}
      value={sPassword}
      required
      invalid={bInvalidPassword}
    />
    <Button
      class="col-auto input-group-text"
      on:click={onToggleDisplayPassword}
    >
      <Icon name="eye" />
    </Button>
  </InputGroup>
  <Button
    type="submit"
    class="w-100"
    color={buttonColor}
    disabled={bFormInvalid}>Create</Button
  >
</Form>
