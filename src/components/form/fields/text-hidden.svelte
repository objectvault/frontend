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

  /* START.CHECKS */
  import du from "../../../dev-utils";

  // Other Libraries used in checks
  import _ from "lodash";
  /* END.CHECKS */

  // SVELTE API //
  import { onMount, createEventDispatcher } from "svelte";

  // SVELTESTRAP
  import { Button, Icon, Input, InputGroup, InputGroupText } from "sveltestrap";

  // Application COMPONENTS //
  import type { FieldTemplate } from "../../../classes/form-template";
  import { EnhancedFieldTemplate } from "../../../classes/form-template";

  // Application LIBRARIES //
  import utilities from "../../../api/utilities";

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // CONSTANTS
  const defaults: any = {
    // DEFAULTS Settings for fields that alias this Field Component
    password: {
      settings: {
        confirmation: true,
        eye: true,
      },
    },
  };

  // Independent Timeout Counters
  const timeouts: any = {
    input: null,
    eye: null,
    clipboard: null,
    get: (id: string) => (timeouts.hasOwnProperty(id) ? timeouts[id] : null),
    set: (id: string, callback: any, timeout: number) => {
      /* START.CHECKS */
      !(id == null || typeof id === "string") &&
        du.throwMessage('"id" is supposed to be a string.');
      !(callback == null || _.isFunction(callback)) &&
        du.throwMessage('"callback" missing or invalid.');
      !(timeout == null || typeof timeout === "number" || timeout > 100) &&
        du.throwMessage('"timeout" missing or invalid.');
      /* END.CHECKS */

      if (timeouts.hasOwnProperty(id)) {
        if (timeouts[id]) {
          clearTimeout(timeouts[id]);
        }

        timeouts[id] = setTimeout(() => callback(), timeout);
      }
    },
    clear: (id: string) => {
      if (timeouts.hasOwnProperty(id) && timeouts[id]) {
        clearTimeout(timeouts[id]);
      }
    },
  };

  // Timeout for Action Buttons (Eye and Clipboard) - 15 seconds
  const buttonTimeout: number = 15000;

  // SPECIAL EXPORT - Treat classes as class attribute
  let classes: string = null;

  // MODULE EXPORTS
  export { classes as class };
  export let mode: string; // ONE OF: read, create, update
  export let field: string; // Field Name
  export let template: FieldTemplate; // Field Template
  export let value: string = null; // INITIAL: Field Value
  export let timeout: number = 300; // Change Propagation Delay
  export let isValid: boolean = true; // DEFAULT: Valid State

  // Internal Variables
  let bShowText: boolean = false;
  let inputValue: string = value == null ? "" : value; // Current Bound Value for INPUT
  let outputValue: string | null = inputValue; // Current Validated Value
  let outputValid: boolean = isValid;

  // OBSERVERS
  $: _template = new EnhancedFieldTemplate(template, defaults[template.type()]);
  $: _props = mode === "read" ? {} : calculateProperties();
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // EVENT HANDLERS //
  function onToggleShow(e: Event) {
    e.preventDefault(); // NEEDED: Clicking on Button Closes Dialog
    bShowText = !bShowText;

    // Hide Text after 15 Seconds
    if (mode == "read") {
      if (bShowText) {
        timeouts.set("eye", () => (bShowText = false), buttonTimeout);
      } else {
        timeouts.clear("eye");
      }
    }
  }

  function onChangeValue(e: InputEvent) {
    let v: string = (e.target as any).value;
    handleValueChange(v);
  }

  function onUpdateInputValue(e: Event) {
    const t: any = e.target as any;
    if (t.value !== outputValue) {
      t.value = inputValue = outputValue;
    }
  }

  async function doCopyToClipboard(e: Event) {
    try {
      // Copy Field Value to clipboard
      await navigator.clipboard.writeText(inputValue);

      // Clear Clipboard after 15 Seconds
      timeouts.set(
        "clipboard",
        async () => {
          try {
            await navigator.clipboard.writeText("--");
          } catch (e) {
            console.info("Could not clear clipboard");
          }
        },
        buttonTimeout
      );
      console.info("Copy to Clipboard");
    } catch (e: any) {
      console.error(e);
    }
  }

  // HELPERS //
  function unsignedProperty(v: any): string | null {
    let n: number;
    if (typeof v === "number") {
      n = Math.floor(<number>v);
    } else if (typeof v === "string") {
      n = parseInt(<string>v);
      if (isNaN(n)) {
        n = -1;
      }
    }

    return n >= 0 ? n.toString() : null;
  }

  function calculateProperties(): any {
    let ps: any = {};

    const settings: any = _template.settings();
    if (settings == null) {
      return ps;
    }

    let value: any = null;
    for (const setting in settings) {
      if (!settings.hasOwnProperty(setting)) {
        continue;
      }

      value = settings[setting];
      switch (setting) {
        case "required":
          if (value) {
            ps.required = true;
          }
          break;
        case "max-length":
          value = unsignedProperty(value);
          if (value !== null && value > 0) {
            ps.maxlength = value;
          }
          break;
        case "min-length":
          value = unsignedProperty(value);
          if (value !== null && value > 0) {
            ps.minlength = value;
          }
          break;
      }
    }

    return ps;
  }

  function applyChecks(v: string): string[] {
    let r: string[] = [];

    const checks: any = _template.checks();
    if (checks == null) {
      return r;
    }

    let value: any = null;
    let passed: boolean = true;
    for (const check in checks) {
      if (!checks.hasOwnProperty(check)) {
        continue;
      }

      value = checks[check];
      passed = true;
      switch (check) {
        case "allow-empty":
          if (!(<boolean>value)) {
            passed = v !== null && v.length > 0;
          }
          break;
      }

      if (!passed) {
        r.push(`check '${check}' failed`);
      }
    }

    return r;
  }

  function applyTransforms(v: string): string {
    // NOTE: Transforms have an Order to be Applied
    if (v.length) {
      // transformation[trim] == true?
      if (_template.transform("trim", false)) {
        // YES: trim string
        v = v.trim();
      } else {
        // transformation[trim] == true?
        if (_template.transform("trim-start", false)) {
          v = utilities.strings.trimStart(v);
        }

        // transformation[trim] == true?
        if (_template.transform("trim-end", false)) {
          v = utilities.strings.trimEnd(v);
        }
      }
    }

    if (v.length) {
      // transformation[case]
      switch (_template.transform("case", null)) {
        case "upper":
          v.toUpperCase();
          break;
        case "lower":
          v.toLowerCase();
      }
    } else if (_template.transform("null-on-empty", false)) {
      v = null;
    }

    return v;
  }

  function processValueChecks(v: string) {
    // Always Notify of Validity on Field Value Changed
    const messages: string[] = applyChecks(v);
    outputValid = messages.length == 0;
    dispatch("onIsValidChanged", {
      field,
      isValid: outputValid,
      messages: outputValid ? null : messages,
    });
  }

  function processValueChange(v: string) {
    v = applyTransforms(v);

    // Has final result changed?
    if (v !== outputValue) {
      // YES: Notify of Change
      outputValue = v;
      dispatch("onFieldValueChanged", {
        field,
        value: v,
      });

      // Perform Value Checks
      processValueChecks(v);
    }
  }

  function handleValueChange(v: string) {
    // Clear Pending Value Changes
    timeouts.set("input", () => processValueChange(v), timeout);

    /*
    if (timeoutID != null) {
      //Y ES: Clear it
      clearTimeout(timeoutID);
      timeoutID = null;
    }

    // Have Pending Value Change
    if (timeoutID === null) {
      // NO: Process on Delay
      timeoutID = setTimeout(() => processValueChange(v), timeout);
    }
    */
  }

  // SVELTE LifeCycle
  onMount(async () => {
    // Is Field Marked as Invalid
    if (!isValid) {
      // YES: Perform Initial Validations Checks
      processValueChecks(inputValue);
    }
  });
</script>

<InputGroup>
  <InputGroupText class="col-3">{_template.label()}</InputGroupText>
  {#if mode === "create" || mode === "update"}
    <Input
      type={bShowText ? "text" : "password"}
      value={inputValue}
      on:input={onChangeValue}
      on:blur={onUpdateInputValue}
      {..._props}
    />
    {#if _template.setting("eye", true)}
      <Button
        class="col-auto input-group-text"
        tabindex={-1}
        on:click={onToggleShow}
      >
        <Icon name="eye" />
      </Button>
    {/if}
  {:else}
    <Input
      type={bShowText ? "text" : "password"}
      value={inputValue}
      disabled={true}
    />
    {#if _template.setting("eye", true)}
      <Button
        class="col-auto input-group-text"
        tabindex={-1}
        on:click={onToggleShow}
      >
        <Icon name="eye" />
      </Button>
    {/if}
    {#if _template.setting("clipboard", false)}
      <Button
        class="col-auto input-group-text"
        tabindex={-1}
        on:click={doCopyToClipboard}
      >
        <Icon name="clipboard" />
      </Button>
    {/if}
  {/if}
</InputGroup>
