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
import du from "../dev-utils";
/* END.CHECKS */

// 3rd Party Libraries //
import _ from "lodash";

// Libraries //
import utils from '../api/utilities';

// WebServices API Library //
import apiStore from "../api/store";

export class StoreObject {
  protected _store: string = null;
  protected _parent: string = null;
  protected _id: string = null;
  protected _type: number = null;
  protected _title: string = null;
  protected _template: any;
  protected _values: any;
  protected _modified: boolean = false;
  protected _loaded: boolean = false;

  constructor(o?: any) {
    /* START.CHECKS */
    (o != null || typeof o !== 'object') && du.throwMessage('Passed Invalid Object Value to constructor.');
    /* END.CHECKS */

    if (o) {
      this._import(o)
    }
  }

  public static isOfType(o: any): boolean {
    return o != null && typeof o === 'object' && '_store' in o && '_parent' in o && '_id' in o && '_wsLoad' in o;
  }

  public static async wsLoad(sid: string, oid: string): Promise<StoreObject> {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(sid) && du.throwMessage('Missing or Empty Store ID');
    utils.strings.isNullOrEmpty(oid) && du.throwMessage('Missing or Empty Object ID');
    /* END.CHECKS */

    // Call Object Loader
    const o = new StoreObject();
    return o._wsRead(sid.trim(), oid.trim());
  }

  public isValid(): boolean {
    // Is Object Loaded
    if (this._loaded) { // YES: Loaded Object have Restricted Property Access
      return this._title != null;
    }

    // Minimum Requirements for New Objects
    return this._store != null && this._type != null;
  }

  public isLoaded(): boolean {
    return this._loaded;
  }

  public isModified(): boolean {
    return this._loaded;
  }

  public isEqual(o: StoreObject, full = false): boolean {
    if ((o == null) || !o.isValid() || !this.isValid()) {
      return false;
    }

    // Test Equality
    let e: boolean = o._store === this._store && o._parent === this._parent && o._id === this._id;
    if (e && full) { // Add Type and Title
      e = e && o._type === this._type;
      e = e && o._title === this._title;
    }
    return e;
  }

  public clone(): StoreObject {
    /*
     * Assuming that Object Clone is for the purpose of creating a new Object
     * (calling wsCreate).
     * Therefore ID and loaded status not copied
     */
    const o: StoreObject = new StoreObject();
    o._store = this._store;
    o._parent = this._parent;
    o._id = null; // <-- NOTE
    o._type = this._type;
    o._title = this._title;
    o._modified = this._modified;
    o._loaded = false; // <-- NOTE

    // Clone Templates
    if (this._template) {
      o._template = _.merge({}, this._template);
    }

    // Deep Clone Values
    if (this._values) {
      o._values = _.cloneDeep(this._values);
    }
    return o;
  }

  public store(): string {
    return this._store;
  }

  public setStore(sid: string): StoreObject {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(sid) && du.throwMessage('Missing or Empty Store ID');
    this._loaded && du.throwMessage('Loaded Object. Store ID can not be modified');
    /* END.CHECKS */

    this._store = sid.trim()
    return this;
  }

  public parent(): string {
    return this._parent;
  }

  public setParent(pid: string): StoreObject {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(pid) && du.throwMessage('Missing or Empty Store ID');
    this._loaded && du.throwMessage('Loaded Object. Use wsMove to change parent.');
    /* END.CHECKS */

    this._id = pid.trim();
    return this;
  }

  public id(): string {
    return this._id;
  }

  public type(): number {
    return this._type;
  }

  public setType(t: number): StoreObject {
    /* START.CHECKS */
    t > 0 && du.throwMessage('Object Type is unsigned.');
    this._loaded && du.throwMessage('Loaded Object. Object Type can not be modified.');
    /* END.CHECKS */

    this._type = t;
    return this;
  }

  public title(): string {
    return this._title;
  }

  public setTitle(t: string): StoreObject {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(t) && du.throwMessage('Missing or Empty Object Title');
    /* END.CHECKS */

    t = t.trim();
    if (this._title !== t) {
      // Set Object Title
      this._title = t;

      // Set Object  Value for Title
      if (this._values === undefined) {
        this._values = { __title: t };
      } else {
        this._values.__title = t;
      }

      this._modified = true;
    }

    return this;
  }

  public template(d?: string): string {
    return this._template === undefined ? d : _.get(this._template, "name", d);
  }

  public templateVersion(d?: number): number {
    return this._template === undefined ? d : _.get(this._template, "version", d);
  }

  public setTemplate(name: string, version: number = 1): StoreObject {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(name) && du.throwMessage('Missing or Empty Template Name');
    version <= 0 && du.throwMessage('Template version has to be >= 1.');
    this._loaded && this._template !== name.trim() && du.throwMessage('Loaded Object. Cannot Modify Template Name.');
    /* END.CHECKS */

    if (this._template === undefined) {
      this._template = {};
    }

    _.set(this._template, 'name', name.trim());
    _.set(this._template, 'version', version);
    this._modified = true;
    return this;
  }

  public values(clone: boolean = false): any {
    if (!clone) {
      return this._values;
    }

    return this._values != null ? _.cloneDeep(this._values) : null;
  }

  public setValues(o: any, clone: boolean = false): StoreObject {
    /* START.CHECKS */
    o != null && typeof o !== 'object' && du.throwMessage('Passed Invalid Object Value to constructor.');
    /* END.CHECKS */

    // Do we want to force a clone?
    if (clone) {
      o = _.cloneDeep(o);
    }

    // Save Title for Special Handling
    let t: string = this._title;
    if ('__title' in o) {
      t = utils.strings.defaultOnEmpty(this._extractString(o, '__title', this._title), null);
    }

    // Set Values without Modifying Title
    this._values = o;
    this._modified = true;

    // Save any changes to Title
    this.setTitle(t);
    return this;
  }

  public value(path: string, d?: any): any {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(path) && du.throwMessage('Missing or Empty Value Path');
    /* END.CHECKS */

    path = path.trim();

    // Are we after the Object Title?
    if (path === '__title') { // YES: Special Handling
      return this.title()
    }

    return this._values === undefined ? d : _.get(this._values, path, d);
  }

  public setValue(path: string, v: any): StoreObject {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(path) && du.throwMessage('Missing or Empty Value Path');
    v == null && du.throwMessage('Missing Value');
    /* END.CHECKS */

    path = path.trim();

    // Are we after the Object Title?
    if (path === '__title') { // YES: Special Handling
      /* START.CHECKS */
      typeof v !== 'string' && du.throwMessage('Title has to be a string');
      /* END.CHECKS */

      return this.setTitle(<string>v)
    }

    if (this._values === undefined) {
      this._values = {};
    }

    _.set(this._values, path, v);
    this._modified = true;
    return this;
  }

  public clearValue(path: string): StoreObject {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(path) && du.throwMessage('Missing or Empty Value Path');
    /* END.CHECKS */

    _.unset(this._values, path.trim());
    this._modified = true;

    return this;
  }

  public import(record: any): StoreObject {
    /* START.CHECKS */
    this._loaded && du.throwMessage('Loaded Object. Cannot use import.');
    /* END.CHECKS */

    // Reset Object and Import
    return this.
      _reset().
      _import(record);
  }

  public async wsCreate(sid: string, pid: string = ":0"): Promise<StoreObject> {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(sid) && du.throwMessage('Missing or Empty Store ID');
    utils.strings.isNullOrEmpty(pid) && du.throwMessage('Missing or Empty Parent Object ID');
    this._template == null && du.throwMessage('Object Missing Template Information.');
    this._loaded && du.throwMessage('Loaded Object. Use wsUpdate to Flush Changes.');
    /* END.CHECKS */

    this._store = sid;
    this._parent = pid;

    return await this._wsCreate()
  }

  public async wsRefresh(force: boolean = false): Promise<StoreObject> {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(this._store) && du.throwMessage('Missing or Empty Store ID');
    utils.strings.isNullOrEmpty(this._id) && du.throwMessage('Missing or Empty Object ID');
    this._loaded && this._modified && !force && du.throwMessage('Loaded Object has been Modified. Force Required to Refresh.');
    /* END.CHECKS */

    // Save ID BEFORE reset
    const sid: string = this._store;
    const oid: string = this._id;

    this._reset();
    return await this._wsRead(sid, oid)
  }

  public async wsUpdate(force: boolean = false): Promise<StoreObject> {
    /* START.CHECKS */
    !this._loaded && du.throwMessage('Object was not Loaded.');
    /* END.CHECKS */

    if (this._modified || force) {
      return await this._wsUpdate();
    }
    return Promise.resolve(this)
  }

  public async wsDelete(force: boolean = true): Promise<boolean> {
    /* START.CHECKS */
    utils.strings.isNullOrEmpty(this._store) && du.throwMessage('Missing or Empty Store ID');
    utils.strings.isNullOrEmpty(this._id) && du.throwMessage('Missing or Empty Object ID');
    this._loaded && this._modified && !force && du.throwMessage('Loaded Object has been Modified. Force Required to Delete.');
    /* END.CHECKS */

    return await this._wsDelete(this._store, this._id);
  }

  protected async _wsCreate(): Promise<StoreObject> {
    // Build Output
    const object: any = {
      template: this._template,
      values: this._values
    }

    // Call Web Service
    const r: any = await apiStore.objects.create(this._store, this._parent, object);
    console.info(r);

    // Import Record and Flag Object as Loaded
    this._import(r);
    this._loaded = true;
    this._modified = false;
    return this
  }

  protected async _wsRead(sid: string, oid: string): Promise<StoreObject> {
    // Call Web Service
    const r: any = await apiStore.objects.read(sid, oid);
    console.info(r);

    // Import Record and Flag Object as Loaded
    this._import(r);
    this._loaded = true;
    return this
  }

  protected async _wsUpdate(): Promise<StoreObject> {
    // Build Output
    const object: any = {
      template: this._template,
      values: this._values
    }

    // Call Web Service
    const r: any = await apiStore.objects.update(this._store, this._parent, this._id, object);
    console.info(r);

    // Import Record and Flag Object as Loaded
    this._import(r);
    this._loaded = true;
    this._modified = false;
    return this
  }

  protected async _wsDelete(sid: string, oid: string): Promise<boolean> {
    const r: any = await apiStore.objects.delete(sid, oid);
    console.info(r);

    this._loaded = false;
    return true;
  }

  protected _reset(): StoreObject {
    // Clean Object State
    this._store = null;
    this._parent = null;
    this._type = null;
    this._id = null;
    this._title = null;
    this._values = undefined;
    this._template = undefined;
    this._modified = false;
    this._loaded = false;

    return this;
  }

  protected _import(o: any): StoreObject {
    // Import, if possible, value
    this._store = this._extractString(o, 'store', null);
    this._parent = this._extractString(o, 'parent', null);
    this._id = this._extractString(o, 'id', null);
    this._type = this._extractNumber(o, 'type', null);
    this._title = this._extractString(o, 'title', null);
    this._values = this._extract(o, "values");
    this._template = this._extract(o, "template");

    return this;
  }

  protected _extract(o: any, pname: string, d?: any): any {
    return _.get(o, pname, d);
  }

  protected _extractString(o: any, pname: string, d: string) {
    let s: string = this._extract(o, pname, d);
    if (utils.strings.isString(s)) {
      s = s.trim();
      if (s.length === 0) {
        s = d;
      }
    } else {
      s = d;
    }
    return s;
  }

  protected _extractNumber(o: any, pname: string, d: number) {
    let n: number = this._extract(o, pname, d);
    return typeof n === 'number' ? n : d;
  }
}
