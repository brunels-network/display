import Dry from "json-dry";
import lodash from "lodash";

import WeightPath from "./WeightPath";
import DateRange from "./DateRange";

import { ValueError } from "./Errors";

function setState(val, def = null) {
  if (val) {
    return val;
  } else {
    return def;
  }
}

function _filterWindow(values, window) {
  if (!values) {
    return values;
  }

  let ret = null;

  Object.keys(values).forEach((key) => {
    let dates = values[key];

    let intersect = window.intersect(dates);

    if (!intersect) {
      if (!ret) {
        ret = { ...values };
      }
      delete ret[key];
    }
  });

  if (ret) {
    return ret;
  } else {
    return values;
  }
}

function _filterProject(values, project) {
  if (!values) {
    return values;
  }

  let ret = null;

  Object.keys(values).forEach((key) => {
    if (!(key in project)) {
      if (!ret) {
        ret = { ...values };
      }
      delete ret[key];
    }
  });

  if (ret) {
    return ret;
  } else {
    return values;
  }
}

class Business {
  constructor(props) {
    this.state = {
      name: null,
      id: null,
      projects: {},
      sources: {},
      positions: {},
      scores: {},
      affiliations: {},
      notes: [],
      weight: {},
      weight_path: {},
      is_highlighted: false,
      is_selected: false,
    };

    this.setState(props);

    this._getHook = null;
    this._isABusinessObject = true;
  }

  static clone(item) {
    let c = new Business();
    c._getHook = item._getHook;
    c.state = lodash.cloneDeep(item.state);
    return c;
  }

  isNode() {
    return true;
  }

  inGroup(group) {
    if (group.getID) {
      let ids = {};
      ids[group.getID()] = 1;
      group = ids;
    }

    let seen = {};

    Object.keys(this.state.affiliations).forEach((key) => {
      for (let index in this.state.affiliations[key]) {
        if (this.state.affiliations[key][index] in group) {
          seen[this.state.affiliations[key][index]] = 1;
        }
      }
    });

    Object.keys(this.state.positions).forEach((key) => {
      for (let index in this.state.positions[key]) {
        if (this.state.positions[key][index] in group) {
          seen[this.state.positions[key][index]] = 1;
        }
      }
    });

    return Object.keys(seen).length === Object.keys(group).length;
  }

  getID() {
    return this.state.id;
  }

  filterKeyDate(keydate){
    const weightpath = this.getWeightPath();

    let weight = weightpath.getWeightAtDate(keydate);

    if (weight <= 0.0){
      return null;
    }

    this.state.weight = weight;

    return this;
  }

  filterSource(source) {
    if (source.getID) {
      let id = source.getID();
      source = {};
      source[id] = 1;
    }

    let nsources = Object.keys(source).length;

    let seen = {};

    Object.keys(this.state.sources).forEach((key) => {
      let s = this.state.sources[key];

      Object.keys(source).forEach((source_id) => {
        if (s.includes(source_id)) {
          seen[source_id] = 1;
        }
      });
    });

    if (Object.keys(seen).length !== nsources) {
      return null;
    } else {
      return this;
    }
  }

  filterProject(project) {
    if (project.getID) {
      let id = project.getID();
      project = {};
      project[id] = 1;
    }

    let nprojects = Object.keys(project).length;

    let seen = {};
    let new_projects = {};

    Object.keys(this.state.projects).forEach((key) => {
      if (key in project) {
        seen[key] = 1;
        new_projects[key] = this.state.projects[key];
      }
    });

    if (Object.keys(seen).length !== nprojects) {
      return null;
    }

    let affiliations = _filterProject(this.state.affiliations, project);
    let positions = _filterProject(this.state.positions, project);
    let weight = _filterProject(this.state.weight, project);
    let sources = _filterProject(this.state.sources, project);

    if (affiliations !== this.state.affiliations || positions !== this.state.positions ||
        weight !== this.state.weight || sources !== this.state.sources) {
      let business = new Business();
      business.state = { ...this.state };
      business.state.affiliations = affiliations;
      business.state.positions = positions;
      business.state.sources = sources;
      business.state.weight = weight;
      business.state.projects = new_projects;
      business._getHook = this._getHook;
      return business;
    } else {
      return this;
    }
  }

  filterWindow(window) {
    if (!window) {
      return this;
    } else if (!window._isADateRangeObject) {
      window = new DateRange(window);
    }

    let affiliations = _filterWindow(this.state.affiliations, window);
    let positions = _filterProject(this.state.positions, window);

    if (affiliations !== this.state.affiliations || positions !== this.state.positions) {
      let business = new Business();
      business.state = { ...this.state };
      business.state.affiliations = affiliations;
      business.state.positions = positions;
      business._getHook = this._getHook;
      return business;
    } else {
      return this;
    }
  }

  setState(state) {
    if (state) {
      this.state.name = setState(state.name);
      this.state.id = setState(state.id);
      this.state.projects = setState(state.projects, {});
      this.state.affiliations = setState(state.affiliations, {});
      this.state.positions = setState(state.positions, {});
      this.state.scores = setState(state.scores, {});
      this.state.sources = setState(state.sources, {});
      this.state.notes = setState(state.notes, []);
      this.state.weight = setState(state.weight);
      this.state.weight_path = setState(state.weight_path, {});

      if (!this.state.name) {
        throw new ValueError("You cannot have an Business without a name");
      }
    }
  }

  _updateHooks(hook) {
    this._getHook = hook;
  }

  merge() {
    return this;
  }

  getProjectID() {
    // return the first matching project ID
    return Object.keys(this.state.projects)[0];
  }

  getWeight(project_id = null) {
    let weight = this.state.weight;

    if (weight === null){
      weight = 5.0;
    }

    return weight;
  }

  getWeightPath(project_id = null) {
    if (project_id === null) {
      // use the first project's weight
      project_id = Object.keys(this.state.weight_path)[0];
    }

    const weight_path = this.state.weight_path[project_id];

    if (!weight_path){
      return new WeightPath();
    }

    return weight_path;
  }

  toString() {
    return `Business(${this.getName()})`;
  }

  getName() {
    return this.state.name;
  }

  getInitials() {
    var parts = [];

    this.state.name.split(" ").forEach((n) => {
      parts.push(n[0]);
    });

    if (parts.length > 0) {
      return parts.join("");
    } else {
      return "??";
    }
  }

  getAffiliations() {
    return this.state.affiliations;
  }

  getPosition(projectID) {
    // Return the position for the associated projectID
    // Returns an array of position IDs
    return this.state.positions[projectID];
  }

  getPositions() {
    // Return the position for the associated projectID
    // Returns an array of position IDs
    return this.state.positions;
  }

  getSources() {
    return this.state.sources;
  }

  getScores() {
    return this.state.scores;
  }

  setSelected(val) {
    if (val) {
      this.state.is_selected = true;
    }
    else {
      this.state.is_selected = false;
    }
  }

  getSelected() {
    return this.state.is_selected;
  }

  setHighlighted(val) {
    if (val) {
      this.state.is_highlighted = true;
    }
    else {
      this.state.is_highlighted = false;
    }
  }

  getHighlighted() {
    return this.state.is_highlighted;
  }

  isNonContributingEngineer(project_id = null) {
    if (project_id === null) {
      // return this status with the first project
      project_id = Object.keys(this.state.positions)[0];
    }

    const positions = this.state.positions[project_id];

    for (let i = 0; i < positions.length; ++i){
      const position = this._getHook(positions[i]);
      const name = position.getCanonical();
      if (name.includes("non-cont")) {
        return true;
      }
    }

    return false;
  }

  getNode() {
    let node = {
      id: this.getID(),
      label: this.getName(),
      title: this.getName(),
      initials: this.getInitials(),
      shape: "square",
      highlighted: this.getHighlighted(),
      selected: this.getSelected(),
      weight: this.getWeight(),
      type: "business",
    };

    return node;
  }

  toDry() {
    return { value: this.state };
  }
}

Business.unDry = function (value) {
  return new Business(value);
};

Dry.registerClass("Business", Business);

export default Business;
