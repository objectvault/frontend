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
    FormGroup,
    Input,
    InputGroup,
    InputGroupText,
    Label,
  } from "sveltestrap";

  // CUSTOM Components //
  import RolesManager from "../roles-manager.svelte";

  // Application LIBRARIES //
  import utilities from "../../api/utilities";
  import { Roles } from "../../classes/roles";

  // TypeScript Types
  type TMessageMap = {
    [key: string]: string;
  };

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // SPECIAL EXPORT - Treat classes as class attribute
  let _classes: string = null;

  // MODULE EXPORTS
  export { _classes as class };

  // COMPONENT Bindable Parameters//
  let sEmail: string = "";
  let bInvalidEmail: boolean = true;

  let sMessage: string = "";

  // NOTE: Organization READ Role (33882113) is REQUIRED and HIDDEN in invitation
  let inviteRoles: Roles = new Roles("33882115");

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
  $: bFormInvalid = bInvalidEmail;

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
      }
      set = true;
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

  function validateEmail() {
    bInvalidEmail = setMessage(
      "email-require",
      sEmail.length == 0 ? "EMAIL: Missing" : null
    );
    if (!bInvalidEmail) {
      bInvalidEmail = setMessage(
        "email-min",
        sEmail.length < 6 ? "EMAIL: Minimum Length is 6" : null
      );
      bInvalidEmail =
        setMessage(
          "email-pattern",
          !utilities.patterns.email.test(sEmail) ? "EMAIL: Invalid Value" : null
        ) || bInvalidEmail;
    }
  }

  function rolesToManagerList(): any {
    return {
      Functions: [
        {
          id: "org",
          label: "Org",
          icon: "building",
          value: 0x02050003,
          fixed: 0x0003,
        },
      ],
    };
  }

  // EVENTS //
  function onKeyDownNoSpace(e: KeyboardEvent) {
    if (e.code === "Space") {
      e.preventDefault();
    }
  }

  function onInputEmail(e: InputEvent) {
    // SPECIAL CONSIDERATION: Pasted Input
    sEmail = (e.target as any).value;
    sEmail = sEmail.trim().replaceAll(/\s/g, "");
    validateEmail();
  }

  function onRolesModification(e: CustomEvent) {
    const v: number = e.detail.value;
    console.info(v.toString(16));
    inviteRoles.set(v);
  }

  function onSubmitForm(e: Event) {
    // Stop Form Submission
    e.preventDefault();

    // Dispatch Invite Click
    dispatch("formSubmit", {
      email: sEmail,
      message: sMessage.trim(),
      roles: inviteRoles.export(),
    });
  }

  // LIFECYCLE MANAGEMENT //
  onMount(() => {
    validateEmail();
  });
</script>

<Form id="formCreateInvite" class={classes} on:submit={onSubmitForm}>
  <InputGroup>
    <InputGroupText>@</InputGroupText>
    <Input
      type="email"
      name="email-invitee"
      placeholder="email of invitee"
      on:keydown={onKeyDownNoSpace}
      on:input={onInputEmail}
      value={sEmail}
      required
      invalid={bInvalidEmail}
    />
  </InputGroup>
  <FormGroup>
    <Label for="iMessage">Message</Label>
    <Input
      id="iMessage"
      type="textarea"
      name="invite-message"
      placeholder="Message to Accompany Invite"
      bind:value={sMessage}
    />
    <hr />
    <RolesManager
      labels={{
        x: {
          label: "Permissions in Organization",
        },
      }}
      roles={rolesToManagerList()}
      on:roleModified={onRolesModification}
    />
  </FormGroup>
  <hr />
  <Button
    type="submit"
    class="w-100"
    color={buttonColor}
    disabled={bFormInvalid}>Send</Button
  >
</Form>
