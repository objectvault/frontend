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
  import { Button, Form, Input, InputGroup, InputGroupText } from "sveltestrap";
  import me from "../../api/me";

  // Application LIBRARIES //
  import utilities from "../../api/utilities";

  // TypeScript Types
  type TMessageMap = {
    [key: string]: string;
  };

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();
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

  function onSubmitForm(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Dispatch Invite Click
    dispatch("formSubmit", {
      alias: sAlias,
      title: sTitle,
    });
  }

  // LIFECYCLE MANAGEMENT //
  onMount(() => {
    validateAlias();
    validateTitle();
  });
</script>

<Form id="formCreateOrg" class={classes} on:submit={onSubmitForm}>
  <InputGroup class="d-flex mb-2">
    <InputGroupText class="col-3">Alias</InputGroupText>
    <Input
      type="text"
      name="org-alias"
      placeholder="Organization Alias"
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
      name="org-title"
      placeholder="Organization Title"
      minlength="4"
      maxlength="80"
      on:input={onInputTitle}
      value={sTitle}
      required
      invalid={bInvalidTitle}
    />
  </InputGroup>
  <Button
    type="submit"
    class="w-100"
    color={buttonColor}
    disabled={bFormInvalid}>Create</Button
  >
</Form>
