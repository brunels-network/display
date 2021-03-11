import Dry from "json-dry";
import lodash from "lodash";

import { ValueError } from "./Errors";

function setState(val, def = null) {
  if (val) {
    return val;
  } else {
    return def;
  }
}

class KeyDate {
  constructor(props) {
    this.state = {
      name: null,
      id: null,
      description: null,
      month: null,
    };

    this.setState(props);

    this._getHook = null;
    this._isAKeyDateObject = true;
  }

  static clone(item) {
    let c = new KeyDate();
    c._getHook = item._getHook;
    c.state = lodash.cloneDeep(item.state);
    return c;
  }

  getID() {
    return this.state.id;
  }

  setState(state) {
    if (state) {
      this.state.name = setState(state.name);
      this.state.id = setState(state.id);
      this.state.description = setState(state.description, "");
      this.state.month = setState(state.month, null);

      if (!this.state.name) {
        throw new ValueError("You cannot have a KeyDate without a name");
      }
    }
  }

  _updateHooks(hook) {
    this._getHook = hook;
  }

  merge() {
    return this;
  }

  toString() {
    return `KeyDate(${this.getName()})`;
  }

  getName() {
    return this.state.name;
  }

  getDescription() {
    return this.state.description;
  }

  getMonth() {
    return this.state.month;
  }

 
  toDry() {
    return { value: this.state };
  }
}

KeyDate.unDry = function (value) {
  return new KeyDate(value);
};

Dry.registerClass("KeyDate", KeyDate);

export default KeyDate;
