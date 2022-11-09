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
    Icon,
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

  let sPassword: string = "";
  let bShowPassword: boolean = false;
  let bInvalidPassword: boolean = true;

  // NOTE: Store R/L Role (50724867) is REQUIRED and Object R/L Role (50790403) is Optional but Preferred
  let inviteRoles: Roles = new Roles("50724867,50790403");

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
  $: bFormInvalid = bInvalidEmail || bInvalidPassword;

  // Helpers //
  function setMessage(k: string, m?: string) {
    let modified: boolean = false;
    let set: boolean = false;

    // Setting a message?
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

  function validatePassword() {
    bInvalidPassword = setMessage(
      "password-require",
      sPassword.length == 0 ? "PASSWORD: Empty" : null
    );
    if (!bInvalidPassword) {
      bInvalidPassword = setMessage(
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
      bInvalidEmail ||= setMessage(
        "email-pattern",
        !utilities.patterns.email.test(sEmail) ? "EMAIL: Invalid Value" : null
      );
    }
  }

  function rolesToManagerList(): any {
    return {
      Functions: [
        {
          id: "store",
          label: "Store",
          icon: "sd-card",
          value: 0x03060003,
          fixed: 0x0003,
        },
        {
          id: "object",
          label: "Objects",
          icon: "archive",
          value: 0x03070003,
          fixed: 0x0000,
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

  function onInputPassword(e: InputEvent) {
    // SPECIAL CONSIDERATION: Pasted Input
    sPassword = (e.target as any).value;
    validatePassword();
  }

  function onToggleShowPassword(e: Event) {
    bShowPassword = !bShowPassword;
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
      password: sPassword,
    });
  }

  // LIFECYCLE MANAGEMENT //
  onMount(() => {
    validateEmail();
    validatePassword();
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
          label: "Permissions in Store",
        },
      }}
      roles={rolesToManagerList()}
      on:roleModified={onRolesModification}
    />
  </FormGroup>
  <hr />
  <InputGroup class="d-flex mb-3">
    <InputGroupText id="lPasswordLabel" class="col-4">Password</InputGroupText>
    <Input
      id="iCurrentPassword"
      type={bShowPassword ? "text" : "password"}
      class="col"
      placeholder="Password"
      aria-label="Password"
      on:input={onInputPassword}
      value={sPassword}
      required
      invalid={bInvalidPassword}
    />
    <Button
      class="col-auto input-group-text"
      tabindex={-1}
      on:click={onToggleShowPassword}
    >
      <Icon name="eye" />
    </Button>
  </InputGroup>
  <Button
    type="submit"
    class="w-100"
    color={buttonColor}
    disabled={bFormInvalid}>Send</Button
  >
</Form>
