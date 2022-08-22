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
  /* END.CHECKS */

  // SVELTE API //
  import { onMount, createEventDispatcher, tick } from "svelte";

  // SVELTESTRAP //
  import {
    Button,
    Form,
    InputGroup,
    InputGroupText,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "sveltestrap";

  // WebServices API Library //
  import apiStore from "../../../api/store";

  // Developer Libraries //
  import type { Store } from "../../../classes/store";
  import { FormTemplate } from "../../../classes/form-template";
  import { StoreObject } from "../../../classes/store-object";

  // CUSTOM Components //
  import SearchableDropdown from "../../../components/searchable-dropdown.svelte";
  import ObjectForm from "./form.svelte";

  // SVELTE Event Dispatcher
  const dispatch = createEventDispatcher();

  // Component Parameters //
  export let store: Store; // Store Profile
  export let object: StoreObject = null; // Store Object (REQUIRED: in edit / view mode)
  export let mode: string = "read"; // Operating Mode
  export let isValid: boolean = true; // DEFAULT: Valid State

  // Object Properties //
  let templates: any[] = []; // List of Templates in Store
  let isOpen: boolean = true;
  let isFormValid: boolean = isValid && mode !== "create";
  let isObjectModified: boolean = false;
  let inCreateMode: boolean = false; // CREATE: Have Accepted Template
  let objectTemplate: FormTemplate = null;
  let values: any = null;

  // OBSERVERS
  $: _modalTitle = getModalTitle(mode, objectTemplate);

  // EVENT HANDLERS //
  function onCloseModal() {
    dispatch("onHandleAction", {
      action: mode === "read" ? "close" : "cancel",
    });
  }

  function onSubmitForm() {
    switch (mode) {
      case "create":
        console.log("Create Object");
        object = new StoreObject();
        object.setTemplate(objectTemplate.name(), objectTemplate.version());
        object.setValues(values);
        break;
      case "update":
        console.log(`Update Object [${object.id()}]`);
        object.setValues(values);
        break;
    }

    dispatch("onHandleAction", {
      action: mode,
      object,
    });
  }

  function onFormValuesChanged(e: CustomEvent) {
    // Update Object
    values = e.detail;

    // Is Object Modified?
    isObjectModified = true;
    isFormValid = true;

    console.log(`Object - Modified`);
  }

  function onIsFormValidChanged(e: CustomEvent) {
    const d: any = e.detail;
    console.log(`Form Validity Change [${d.isValid}]`);

    if (isFormValid != d.isValid) {
      isFormValid = d.isValid;
      console.log(`Form is now [${isFormValid}]`);
    }
  }

  async function onSelectTemplate(e: CustomEvent) {
    try {
      console.log(`Choose Template: ${e.detail}`);
      objectTemplate = await getObjectTemplate(store.id(), e.detail);
    } catch (e) {
      isOpen = false; // Close Dialog
      notifyOfError(e.toString());
    }
  }

  function onContinueCreate() {
    inCreateMode = true;
  }

  // HELPERS //
  async function listStoreTemplate(id: string): Promise<any> {
    // Reload Templates List
    // TODO: Have to add Filter Option SVELTE Control or else if list grows bigger than 100 items, it will be cut off
    const list: any = await apiStore.templates.list(id);
    if (list != null) {
      templates = list.items ? list.items : [];
    }

    if (templates.length == 0) {
      console.log("Store has No Templates");
    }

    return templates;
  }

  async function getObjectTemplate(
    sid: string,
    template: string
  ): Promise<FormTemplate> {
    const r: any = await apiStore.templates.get(sid, template);
    console.info(r);
    return new FormTemplate(r);
  }

  function getModalTitle(mode: string, template: FormTemplate): string {
    switch (mode) {
      case "create":
        return template ? `Create ${template.title()}` : `Create Object`;
      case "read":
        return template ? `View ${template.title()}` : `View Object`;
      case "update":
        return template ? `Update ${template.title()}` : `Update Object`;
    }
  }

  // HELPERS //
  function notifyOfError(msg: string, mount = false) {
    dispatch("onPerformAction", {
      action: "error",
      message: msg,
      mount,
    });
  }

  function getObjectValues(): any {
    if (object) {
      values = object.values(true);
    }
    return values;
  }

  // SVELTE LifeCycle
  onMount(async () => {
    try {
      console.info(`EDITOR MODE [${mode}]`);
      const sid: string = store.id();
      switch (mode) {
        case "create":
          templates = await listStoreTemplate(sid);
          break;
        case "read":
        case "update":
          /* START.CHECKS */
          object == null && du.throwMessage("Missing Object for Editor.");
          !(object instanceof StoreObject) &&
            du.throwMessage("Invalid Object Type.");
          /* END.CHECKS */

          objectTemplate = await getObjectTemplate(sid, object.template());
          break;
        default:
          throw `Invalid Editor Mode [${mode}]`;
      }
    } catch (e) {
      // TODO: Improve Error Handling (Should Display Toast)
      await tick();

      isOpen = false; // Close Dialog
      notifyOfError(e.toString(), true);
    }
  });
</script>

<Modal {isOpen} toggle={onCloseModal} name="create-object">
  <ModalHeader toggle={onCloseModal}>
    {_modalTitle}
  </ModalHeader>
  <ModalBody>
    {#if mode === "read"}
      {#if objectTemplate}
        <ObjectForm
          {mode}
          isValid={isFormValid}
          template={objectTemplate}
          values={getObjectValues()}
        />
      {/if}
    {:else if mode === "update"}
      {#if objectTemplate}
        <Form name="object-editor" on:submit={onSubmitForm}>
          <ObjectForm
            {mode}
            template={objectTemplate}
            isValid={isFormValid}
            on:onFormValuesChanged={onFormValuesChanged}
            on:onIsFormValidChanged={onIsFormValidChanged}
            values={getObjectValues()}
          />
          <Button
            type="submit"
            color="primary"
            class="w-100"
            disabled={!(isFormValid && isObjectModified)}
            >Update
          </Button>
        </Form>
      {/if}
    {:else}
      {#if templates && templates.length}
        <InputGroup class="d-flex mb-3">
          <InputGroupText class="col-3">Template</InputGroupText>
          <SearchableDropdown
            items={templates}
            mapper={{
              value: "name",
              label: "title",
            }}
            select={objectTemplate ? objectTemplate.name() : null}
            on:onSelect={onSelectTemplate}
            disabled={inCreateMode}
          />
        </InputGroup>
        {#if !inCreateMode && objectTemplate}
          <Button color="primary" class="w-100" on:click={onContinueCreate}
            >Continue
          </Button>
        {/if}
      {:else}
        <div>No Templates in Store</div>
      {/if}
      {#if inCreateMode}
        <Form name="object-editor" on:submit={onSubmitForm}>
          <ObjectForm
            {mode}
            template={objectTemplate}
            isValid={isFormValid}
            on:onFormValuesChanged={onFormValuesChanged}
            on:onIsFormValidChanged={onIsFormValidChanged}
          />
          <Button
            type="submit"
            color="primary"
            class="w-100"
            disabled={!isFormValid}
          >
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </Form>
      {/if}
    {/if}
  </ModalBody>
  {#if mode !== "read"}
    <ModalFooter>
      <div class="text-danger">Message</div>
    </ModalFooter>
  {/if}
</Modal>
