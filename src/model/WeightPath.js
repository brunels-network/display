import Dry from "json-dry";
import lodash from "lodash";
import KeyDate from "./KeyDate";

function setState(val, def = null) {
  if (val) {
    return val;
  } else {
    return def;
  }
}

class WeightPath {
  constructor(props) {
    this.state = {
      id: null,
      start_weight: null,
      start_date: null,
      weight_change: null,
      date_change: null,
      location: null,
    };

    this.setState(props);

    this._getHook = null;
    this._isAWeightPathObject = true;
  }

  static clone(item) {
    let c = new WeightPath();
    c._getHook = item._getHook;
    c.state = lodash.cloneDeep(item.state);
    return c;
  }

  getID() {
    return this.state.id;
  }

  getStartWeight() {
    if (!this.state.start_weight){
      return 0.0;
    } else {
      return this.state.start_weight;
    }
  }

  getStartDate() {
    return this.state.start_date;
  }

  getWeightChange() {
    if (!this.state.weight_change){
      return 0.0;
    } else {
      return this.state.weight_change;
    }
  }

  getDateChange() {
    return this.state.date_change;
  }

  getLocation() {
    return this.state.location;
  }

  getWeightAtDate(keydate){
    if (!keydate){
      return this.getStartWeight();
    }

    let d = this.getStartDate();

    if (d === null){
      return this.getStartWeight();
    }

    d = new KeyDate({name: d});

    if (d.isLater(keydate)){
      return 0.0;
    } 
    
    d = this.getDateChange();

    if (d === null){
      return this.getStartWeight();
    }

    d = new KeyDate({name: d});

    if (d.isLater(keydate)) {
      return this.getStartWeight();
    } else { 
      return this.getStartWeight() + this.getWeightChange();
    }
  }

  setState(state) {
    if (state) {
      this.state.id = setState(state.id);
      this.state.start_weight = setState(parseFloat(state.start_weight), 1.0);
      this.state.start_date = setState(parseFloat(state.start_date), null);
      this.state.weight_change = setState(parseFloat(state.weight_change), 0.0);
      this.state.date_change = setState(parseFloat(state.date_change), null);
      this.state.location = setState(state.location, null);
    }
  }

  _updateHooks(hook) {
    this._getHook = hook;
  }

  merge() {
    return this;
  }

  toString() {
    return `WeightPath(${this.getStartWeight()}-${this.getStartDate()})`;
  }

  toDry() {
    return { value: this.state };
  }
}

WeightPath.unDry = function (value) {
  return new WeightPath(value);
};

Dry.registerClass("WeightPath", WeightPath);

export default WeightPath;
