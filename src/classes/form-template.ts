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

// Other Libraries //
import _ from "lodash";
import { TemplateObjectAdaptor } from './template-object-adapter';

export class FieldTemplate {
  private _name: string = null;
  private _field: any = null;

  constructor(n: string, f: any) {
    this._name = n;
    this._field = f;
  }

  public name(): string {
    return this._name;
  }

  public type(): string {
    return this._field.type;
  }

  public label(): string {
    return this._field.label;
  }

  public placeholder(d = null): string {
    if (this._field.hasOwnProperty('placeholder')) {
      const p: string = this._field.placeholder;
      return p != null ? p : d;
    }

    return d;
  }

  public settings(): any {
    return this._field.hasOwnProperty('settings') ? this._field.settings : null;
  }

  public setting(n: string, d?: any): any {
    const v: any = this.settings();
    return v !== null && v.hasOwnProperty(n) ? v[n] : d;
  }

  public transforms(): any {
    return this._field.hasOwnProperty('transforms') ? this._field.transforms : null;
  }

  public transform(n: string, d?: any): any {
    const v: any = this.transforms();
    return v !== null && v.hasOwnProperty(n) ? v[n] : d;
  }

  public checks(): any {
    return this._field.hasOwnProperty('checks') ? this._field.checks : null;
  }

  public check(n: string, d?: any): any {
    const v: any = this.checks();
    return v !== null && v.hasOwnProperty(n) ? v[n] : d;
  }

  public path(): any {
    const p: string = this._field.path;
    return p != null ? p : this._name;
  }
}

export class EnhancedFieldTemplate {
  private _field: FieldTemplate = null;
  private _settings: any = null;
  private _checks: any = null;
  private _transforms: any = null;

  constructor(f: FieldTemplate, defaults: any) {
    /* START.CHECKS */
    (f == null || !(f instanceof FieldTemplate)) && ("Invalid Parameter Value for 'f'. FieldTemplate expected.");
    (defaults == null || !_.isPlainObject(defaults)) && ("Invalid Parameter Value for 'defaults'. NULL or Plain Object expected.");
    /* END.CHECKS */

    this._field = f;
    if (defaults == null) {
      this._settings = f.settings();
      this._checks = f.checks();
      this._transforms = f.transforms();
    } else {
      this._settings = this._merge(defaults.settings, f.settings())
      this._checks = this._merge(defaults.checks, f.checks())
      this._transforms = this._merge(defaults.transforms, f.transforms())
    }
  }

  protected _merge(defaults: any, template: any) {
    if (defaults != null && template != null) {
      return _.merge({}, defaults, template)
    } else if (defaults != null) {
      return _.merge({}, defaults)
    } else if (template != null) {
      return template
    }
    return null;
  }

  public name(): string {
    return this._field.name();
  }

  public type(): string {
    return this._field.type();
  }

  public label(): string {
    return this._field.label();
  }

  public placeholder(d = null): string {
    return this._field.placeholder(d);
  }

  public settings(): any {
    return this._settings;
  }

  public setting(n: string, d?: any): any {
    const v: any = this._settings;
    return v !== null && v.hasOwnProperty(n) ? v[n] : d;
  }

  public transforms(): any {
    return this._transforms;
  }

  public transform(n: string, d?: any): any {
    const v: any = this._transforms;
    return v !== null && v.hasOwnProperty(n) ? v[n] : d;
  }

  public checks(): any {
    return this._checks;
  }

  public check(n: string, d?: any): any {
    const v: any = this._checks;
    return v !== null && v.hasOwnProperty(n) ? v[n] : d;
  }

  public path(): any {
    return this._field.path();
  }
}

export class GroupTemplate {
  private _name: string = null;
  private _group: any = null;

  constructor(n: string, g: any) {
    this._name = n;
    this._group = g;
  }

  public name(): string {
    return this._name;
  }

  public layout(): string {
    const l: string = this._group.layout;
    return l != null ? l : "row";
  }

  public fields(): string[] {
    return this._group.fields;
  }
}

export class FormTemplate {
  private _name: string = null;
  private _version: number = null;
  private _model: any = null;

  constructor(t: any) {
    this._import(t)
  }

  public static isOfType(o: any): boolean {
    return o != null && typeof o === 'object' && '_name' in o && '_version' in o;
  }

  public name(): string {
    return this._name;
  }

  public version(): number {
    return this._version;
  }

  public title(): string {
    return this._extract(this._model, "display.title", null);
  }

  public layout(): string {
    return this._extractString(this._model, "display.layout", "column");
  }

  public groups(): string[] {
    return this._extract(this._model, "display.groups", [])
  }

  public group(n: string): GroupTemplate {
    const g: any = this._model.groups[n];
    if (g != null) {
      return new GroupTemplate(n, g);
    }
    return null;
  }

  public fields(): string[] {
    return Object.keys(this._model.fields)
  }

  public field(n: string): FieldTemplate {
    const f: any = this._model.fields[n];
    if (f != null) {
      return new FieldTemplate(n, f);
    }
    return null;
  }

  private _import(t: any) {
    this._name = this._extractString(t, 'name', null);
    this._version = this._extractNumber(t, 'version', null);

    // Extract JSON Model
    const m = this._extract(t, "model", null);
    this._model = m != null && _.isString(m) ? JSON.parse(m) : m;
  }

  private _extract(o: any, path: string, d: any): any {
    return _.get(o, path, d);
  }

  private _extractString(o: any, path: string, d: string) {
    let s: string = this._extract(o, path, d);
    if (typeof s === 'string') {
      s = s.trim();
      if (s.length === 0) {
        s = d;
      }
    } else {
      s = d;
    }
    return s;
  }

  private _extractNumber(o: any, path: string, d: number) {
    let n: number = this._extract(o, path, d);
    return typeof n === 'number' ? n : d;
  }
}
