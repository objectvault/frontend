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
  import { onMount, createEventDispatcher } from "svelte";

  // SVELTESTAP
  import { FormGroup, Input, Label } from "sveltestrap";

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
    text: {
      settings: {
        html: false,
      },
    },
    "text-html": {
      settings: {
        html: true,
      },
    },
  };

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
  let inner: HTMLTextAreaElement;
  let inputValue: string = value == null ? "" : value; // Current Bound Value for INPUT
  let outputValue: string | null = inputValue; // Current Validated Value
  let outputValid: boolean = isValid;
  let timeoutID: number | null = null;

  // DEFAULT Options for fields that use text-area as UI
  // OBSERVERS
  $: _template = new EnhancedFieldTemplate(template, defaults[template.type()]);
  $: _props = mode === "read" ? {} : calculateProperties();
  $: _classes = utilities.classes.merge(
    utilities.strings.defaultOnEmpty(classes, "")
  );

  // EVENT HANDLERS //
  function onResize(e: InputEvent) {
    inner.style.height = "auto";
    inner.style.height = 4 + inner.scrollHeight + "px";

    let v: string = (e.target as any).value;
    handleValueChange(v);
  }

  function onUpdateInputValue(e: Event) {
    const t: any = e.target as any;
    if (t.value !== outputValue) {
      t.value = inputValue = outputValue;
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
      // transfomation[trim] == true?
      if (_template.transform("trim", false)) {
        // YES: trim string
        v = v.trim();
      } else {
        // transfomation[trim] == true?
        if (_template.transform("trim-start", false)) {
          v = utilities.strings.trimStart(v);
        }

        // transfomation[trim] == true?
        if (_template.transform("trim-end", false)) {
          v = utilities.strings.trimEnd(v);
        }
      }
    }

    if (v.length) {
      // transfomation[case]
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
    // Have Pending Value Change
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

{#if mode === "create" || mode === "update"}
  <FormGroup>
    <Label>{_template.label()}</Label>
    <Input
      bind:inner
      rows={1}
      type="textarea"
      value={inputValue}
      on:input={onResize}
      on:blur={onUpdateInputValue}
      {..._props}
    />
  </FormGroup>
{:else}
  <div>
    <Label>{_template.label()}</Label>
    <pre>{inputValue}</pre>
  </div>
{/if}
