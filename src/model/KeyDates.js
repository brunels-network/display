import Dry from "json-dry";
import { v4 as uuidv4 } from "uuid";
import lodash from "lodash";

import KeyDate from "./KeyDate";
import { KeyError, MissingError } from "./Errors";

function _generate_keydate_uid() {
  let uid = uuidv4();
  return "K" + uid.substring(uid.length - 7);
}

class KeyDates {
  constructor() {
    this.state = {
      registry: {},
    };

    this._names = {};
    this._isAKeyDatesObject = true;
    this._sorted_dates = null;
  }

  _updateHooks(hook) {
    this._getHook = hook;
    for (let key in this.state.registry) {
      this.state.registry[key]._updateHooks(hook);
    }
  }

  static clone(item) {
    let c = new KeyDates();
    c.state = lodash.cloneDeep(item.state);
    c._names = lodash.cloneDeep(item._names);
    c._getHook = item._getHook;
    return c;
  }

  values() {
    let names = Object.keys(this._names);

    let output = [];

    names.forEach((key) => {
      output.push(this.get(this._names[key]));
    });

    return output;
  }

  getNames() {
    return Object.keys(this._names);
  }

  getIDs() {
    return Object.values(this._names);
  }

  keyDates() {
    return this._names;
  }

  getDetails() {
    return this._names;
  }

  getByIndex(date_index){
    let sorted_dates = this.getSortedDates();

    if (date_index < 0){
      return date_index = 0;
    } else if (date_index >= sorted_dates.length) {
      return sorted_dates.length - 1;
    }

    return sorted_dates[date_index];
  }

  getSortedDates(){
    if (this._sorted_dates){
      return this._sorted_dates;
    }

    let d = this.getNames();
    d.sort((a, b) => {return a - b});

    let dates = [];

    d.forEach((value) => {
      dates.push(this.getByName(value));
    });

    this._sorted_dates = dates;

    return this._sorted_dates;
  }

  canAdd(item) {
    return item instanceof KeyDate || item._isAKeyDateObject;
  }

  getNumDates(){
    return Object.keys(this._names).length;
  }

  wrapIndex(date_index) {
    date_index = parseInt(date_index);

    let num_dates = this.getNumDates();

    if (num_dates <= 0){
      num_dates = 1;
    }

    if (date_index === NaN){
      return 0;
    } else if (date_index < 0){
      return num_dates - 1;
    } else if (date_index >= num_dates){
      return 0;
    } else {
      return date_index;
    }
  }

  add(keydate) {
    if (!this.canAdd(keydate)) {
      return null;
    }

    let existing = null;

    try {
      existing = this.getByName(keydate.getName());
    } catch (error) {
      console.error("Cannot get key date", error);
    }

    if (existing) {
      existing = existing.merge(keydate);
      this.state.registry[existing.getID()] = existing;
      return existing;
    }

    keydate = KeyDate.clone(keydate);

    let id = keydate.getID();

    if (id) {
      if (id in this.state.registry) {
        throw new KeyError(`Duplicate KeyDate ID ${keydate}`);
      }

      keydate._updateHooks(this._getHook);
      this.state.registry[id] = keydate;
    } else {
      let uid = _generate_keydate_uid();

      while (uid in this.state.registry) {
        uid = _generate_keydate_uid();
      }

      keydate.state.id = uid;
    }

    keydate._updateHooks(this._getHook);
    this._names[keydate.getName()] = keydate.getID();
    this.state.registry[keydate.getID()] = keydate;

    return keydate;
  }

  getByName(name) {
    let id = this._names[name];

    if (id) {
      return this.get(id);
    } else {
      throw new MissingError(`No key date with name ${name}`);
    }
  }

  find(name) {
    if (name instanceof KeyDate || name._isAKeyDateObject) {
      return this.get(name.getID());
    }

    name = name.trim().toLowerCase();

    let results = [];

    Object.keys(this._names).forEach((key) => {
      if (key.toLowerCase().indexOf(name) !== -1) {
        results.push(this.get(this._names[key]));
      }
    });

    if (results.length === 1) {
      return results[0];
    } else if (results.length > 1) {
      return results;
    }

    let keys = Object.keys(this._names).join("', '");

    throw new MissingError(`No key date matches '${name}. Available key dates are '${keys}'`);
  }

  get(id) {
    let keydate = this.state.registry[id];

    if (!keydate) {
      throw new MissingError(`No KeyDate with ID ${id}`);
    }

    return keydate;
  }

  toDry() {
    return { value: this.state };
  }
}

KeyDates.unDry = function (value) {
  let keydates = new KeyDates();
  keydates.state = value;
  keydates._names = {};

  Object.keys(value.registry).forEach((key) => {
    let v = value.registry[key];
    keydates._names[v.getName()] = key;
  });

  return keydates;
};

Dry.registerClass("KeyDates", KeyDates);

export default KeyDates;
