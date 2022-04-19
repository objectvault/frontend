/*
 * This file is part of the ObjectVault Project.
 * Copyright (C) 2020-2022 Paulo Ferreira <vault at sourcenotes.org>
 *
 * This work is published under the GNU AGPLv3.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Other Libraries //
import _ from "lodash";

export class TemplateField {
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

  public validations(): any {
    return this._field.hasOwnProperty('validations') ? this._field.validations : null;
  }

  public path(): any {
    const p: string = this._field.path;
    return p != null ? p : this._name;
  }
}

export class TemplateGroup {
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
  private _template: any = null;
  private _model: any = null;

  constructor(t: any) {
    this._import(t)
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

  public group(n: string): TemplateGroup {
    const g: any = this._model.groups[n];
    if (g != null) {
      return new TemplateGroup(n, g);
    }
    return null;
  }

  public fields(): string[] {
    return Object.keys(this._model.fields)
  }

  public field(n: string): TemplateField {
    const f: any = this._model.fields[n];
    if (f != null) {
      return new TemplateField(n, f);
    }
    return null;
  }

  private _import(t: any) {
    this._template = t;
    this._name = this._extractString(t, 'name', null);
    this._version = this._extractNumber(t, 'version', null);
    this._model = this._extract(t, "model", null);
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
