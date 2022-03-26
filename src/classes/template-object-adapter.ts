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

// Template API //
import type { FormTemplate, TemplateField, TemplateGroup } from './form-template';
import type { StoreObject } from './store-object';

export class TemplateObjectAdaptor {
  private _template: FormTemplate = null;
  private _object: StoreObject = null;

  public groups(): string[] {
    return this._template.groups();
  }

  public group(n: string): TemplateGroup {
    return this._template.group(n);
  }

  public fields(): string[] {
    return this._template.fields();
  }

  public field(n: string): TemplateField {
    return this._template.field(n);
  }

  public id(): string {
    return this._object != null ? <string>this._object.id(true) : undefined;
  }

  public title(): string {
    const t: string = this._object != null ? this._object.title() : "";
    return t != null ? t : "";
  }

  public value(n: string, d?: any): any {
    if (this._object != null) {
      switch (n) {
        case "id":
          return this._object.id(true);
        case "title":
          return this._object.title();
        default:
          const f: TemplateField = this._template.field(n);
          if (f != null) {
            const p: string = f.path()
            if (p != null) {
              return this._object.property(p, d);
            }
          }
      }
    }

    return undefined;
  }

  public object(): StoreObject {
    return this._object;
  }

  public setTemplate(t: FormTemplate) {
    this._template = t;
  }

  public setObject(o: StoreObject) {
    this._object = o;
  }

  public setTitle(v: string) {
    if (this._object != null) {
      this._object.setTitle(v)
    }
  }

  public setField(n: string, v: any) {
    if (this._object != null) {
      switch (n) {
        case "title":
          this._object.setTitle(v)
          break;
        default:
          const f: TemplateField = this._template.field(n);
          if (f != null) {
            const p: string = f.path()
            if (p != null) {
              this._object.setProperty(p, v);
            }
          }
      }
    }
  }

  public clearField(n: string) {
    if (this._object != null) {
      switch (n) {
        case "title":
          this._object.setTitle(null)
          break;
        default:
          const f: TemplateField = this._template.field(n);
          if (f != null) {
            const p: string = f.path()
            if (p != null) {
              this._object.unsetProperty(p);
            }
          }
      }
    }
  }

  public export(): any {
    if (this._object != null) {
      // Clone Values
      const values: any = _.merge({}, this._object.values());

      // Create Export Values
      return {
        header: {
          title: this.title()
        },
        template: {
          name: this._template.name(),
          version: this._template.version()
        },
        values
      };
    }

    return null;
  }
};
