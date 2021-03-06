import Dry from "json-dry";
import lodash, { isString } from "lodash";

import People from "./People";
import Businesses from "./Businesses";
import Connections from "./Connections";
import Positions from "./Positions";
import Affiliations from "./Affiliations";
import Sources from "./Sources";
import Notes from "./Notes";
import Projects from "./Projects";
import Biographies from "./Biographies";
import KeyDates from "./KeyDates";
import DateRange from "./DateRange";
import get_id from "./get_id";

import score_by_influence from "./ScoringFunctions";
import size_by_weight from "./SizingFunctions";

import {
  ValueError
} from "./Errors";

function _push(values, list) {
  if (!list || !values) {
    return;
  }

  if (values.length) {
    for (let i = 0; i < values.length; ++i) {
      list.push(values[i]);
    }
  } else {
    list.push(values);
  }
}

class Social {
  constructor(props) {
    if (props) {
      this.state = props;
    } else {
      this.state = {};
    }

    this.state.anchor = null;
    this.state.filter = {};
    this.state.cache = {
      graph: null,
      projectTimeLine: null,
      itemTimeLine: null,
      node_filters: null,
      edge_filters: null,
      people: null,
      businesses: null,
      connections: null,
    };
    this.state.window = new DateRange();
    this.state.max_window = new DateRange();
    this.state.scoring_function = score_by_influence;
    this.state.sizing_function = size_by_weight;
    this.state.filter_unconnected = true;
    this.state.filter_nc_engineers = true;
    this.state.images = {};
    this.state.default_image = null;
    this.state.project_text = {};
    this.state.help_text = null;
    this._rebuilding = 0;
    this._displayed_people = {};
    this._people_at_stages = null;

    this._isASocialObject = true;
  }

  static clone(item) {
    let c = new Social();
    c.state = lodash.cloneDeep(item.state);
    return c;
  }

  _updateHooks() {
    let getHook = (id) => {
      return this.get(id);
    };

    let state = {
      ...this.state
    };

    if (!(this.state.people instanceof People)) {
      state.people = new People();
    } else {
      state.people = this.state.people;
    }

    if (!(this.state.businesses instanceof Businesses)) {
      state.businesses = new Businesses();
    } else {
      state.businesses = this.state.businesses;
    }

    if (!(this.state.connections instanceof Connections)) {
      state.connections = new Connections();
    } else {
      state.connections = this.state.connections;
    }

    if (!(this.state.positions instanceof Positions)) {
      state.positions = new Positions();
    } else {
      state.positions = this.state.positions;
    }

    if (!(this.state.affiliations instanceof Affiliations)) {
      state.affiliations = new Affiliations();
    } else {
      state.affiliations = this.state.affiliations;
    }

    if (!(this.state.sources instanceof Sources)) {
      state.sources = new Sources();
    } else {
      state.sources = this.state.sources;
    }

    if (!(this.state.notes instanceof Notes)) {
      state.notes = new Notes();
    } else {
      state.notes = this.state.notes;
    }

    if (!(this.state.projects instanceof Projects)) {
      state.projects = new Projects();
    } else {
      state.projects = this.state.projects;
    }

    if (!(this.state.biographies instanceof Biographies)) {
      state.biographies = new Biographies();
    } else {
      state.biographies = this.state.biographies;
    }

    if (!(this.state.keydates instanceof KeyDates)) {
      state.keydates = new KeyDates();
    } else {
      state.keydates = this.state.keydates;
    }

    this.state = state;

    for (let key in this.state) {
      try {
        this.state[key]._updateHooks(getHook);
      } catch (error) {
        // console.error("For key : ", key, "\nError: ", error);
      }
    }
  }

  setImage(id, filename, credit) {
    id = get_id(id);
    this.state.images[id] = [filename, credit];
  }

  setDefaultImage(filename) {
    this.state.default_image = filename;
  }

  setKeyDateFilter(date_index){
    if (date_index === 0){
      // new run, clear list of displayed people
      this.state._displayed_people = {};
    }

    this.state.filter["date_index"] = date_index;
    this.clearCache();
  }

  getKeyDates(){
    return this.state.keydates;
  }

  getImage(id) {
    id = get_id(id);
    let image = this.state.images[id];

    if (image) {
      return image[0];
    } else {
      return this.state.default_image;
    }
  }

  getImageCredit(id) {
    id = get_id(id);
    let credit = this.state.images[id];

    if (credit) {
      return credit[1];
    } else {
      return null;
    }
  }

  setHelpText(text) {
    this.state.help_text = text;
  }

  getHelpText() {
    return this.state.help_text;
  }

  setProjectText(id, text) {
    id = get_id(id);
    this.state.project_text[id] = text;
  }

  getProjectText(id) {
    id = get_id(id);
    return this.state.project_text[id];
  }

  filterNonContributingEngineers(filter = true) {
    if (this.state.filter_nc_engineers === filter) {
      return;
    }

    if (filter) {
      this.state.filter_nc_engineers = true;
    }
    else {
      this.state.filter_nc_engineers = false;
    }

    this.clearCache();
  }

  filterUnconnectedNodes(filter = true) {
    if (this.state.filter_unconnected === filter) {
      return;
    }

    if (filter) {
      this.state.filter_unconnected = true;
    }
    else {
      this.state.filter_unconnected = false;
    }

    this.clearCache();
  }

  clearCache() {
    this.state.cache = {
      graph: null,
      projectTimeLine: null,
      itemTimeLine: null,
      node_filters: null,
      edge_filters: null,
      people: null,
      businesses: null,
      connections: null,
    };
    this._rebuilding = 0;
  }

  getNodeFilters() {
    if (this.state.cache.node_filters) {
      return this.state.cache.node_filters;
    }

    this._rebuilding += 1;
    this.state.cache.node_filters = [];

    // Must do time first, as this can affect all of the other filters!
    /*let window = this.getWindow();

    if (window.hasStart() || window.hasEnd()) {
      this.state.cache.node_filters.push((item) => {
        try {
          return item.filterWindow(window);
        } catch (error) {
          console.log(`ERROR ${error}: ${item}`);
          return item;
        }
      });
    }*/

    /*const project_filter = this.state.filter.project;

    if (project_filter) {
      this.state.cache.node_filters.push((item) => {
        return item.filterProject(project_filter);
      });
    }*/

    /*const source_filter = this.state.filter.source;

    if (source_filter) {
      this.state.cache.node_filters.push((item) => {
        return item.filterSource(source_filter);
      });
    }*/

    const date_index = this.state.filter.date_index;

    if (date_index !== null){
      const keydate = this.getKeyDates().getByIndex(date_index);

      this.state.cache.node_filters.push((item) => {
        return item.filterKeyDate(keydate);
      });
    }

    const node_filter = this.state.filter.node;

    if (node_filter) {
      let connections = this.getConnectionsTo(node_filter);
      let filter = {
        ...node_filter
      };

      // this filter is returning matching people and the nodes
      // that are connected to these people

      for (let connection in connections) {
        let node = connections[connection];
        filter[get_id(node)] = 1;
      }

      this.state.cache.node_filters.push((item) => {
        if (get_id(item) in filter) {
          return item;
        } else {
          return null;
        }
      });
    }

    const group_filter = this.state.filter.group;

    if (group_filter) {
      this.state.cache.node_filters.push((item) => {
        try {
          // use an "OR" match at the moment as this is more
          // appropriate for the current use of the gui
          if (item.inGroup(group_filter, false)) {
            return item;
          } else {
            return null;
          }
        } catch (error) {
          console.log(`Filter error: ${error}`);
          return item;
        }
      });
    }

    this._rebuilding -= 1;
    return this.state.cache.node_filters;
  }

  getEdgeFilters() {
    if (!this.state.cache.edge_filters) {
      this.state.cache.edge_filters = [];

      // must do time first, as this can affect all of the other filters!
      let window = this.getWindow();

      if (window.hasStart() || window.hasEnd()) {
        this.state.cache.edge_filters.push((item) => {
          try {
            return item.filterWindow(window);
          } catch (error) {
            console.log(`ERROR ${error}: ${item}`);
            return item;
          }
        });
      }

      const project_filter = this.state.filter.project;

      if (project_filter) {
        this.state.cache.edge_filters.push((item) => {
          try {
            return item.filterProject(project_filter);
          } catch (error) {
            console.log(`ERROR ${error}: ${item}`);
            return item;
          }
        });
      }

      const source_filter = this.state.filter.source;

      if (source_filter) {
        this.state.cache.edge_filters.push((item) => {
          try {
            return item.filterSource(source_filter);
          } catch (error) {
            console.log(`ERROR ${error}: ${item}`);
            return item;
          }
        });
      }
    }

    return this.state.cache.edge_filters;
  }

  getWindow() {
    return this.state.window;
  }

  getMaxWindow() {
    return this.state.max_window;
  }

  _fitWindow(window) {
    let new_window = this.state.max_window.intersect(window);

    let delta = window.getDelta();

    if (new_window && new_window.getDelta() === delta) {
      return window;
    }

    if (delta > this.state.max_window.getDelta()) {
      return DateRange.clone(this.state.max_window);
    }

    if (window.getStartDate() < this.state.max_window.getStartDate()) {
      return new DateRange({
        start: this.state.max_window.getStartDate(),
        end: this.state.max_window.getStartDate() + delta,
      });
    } else {
      return new DateRange({
        start: this.state.max_window.getEndDate() - delta,
        end: this.state.max_window.getEndDate(),
      });
    }
  }

  setMaxWindow(window) {
    if (!window._isADateRangeObject) {
      window = new DateRange(window);
    }

    if (window === this.state.max_window) {
      return;
    }

    this.state.max_window = window;

    if (this.state.window && this.state.window.hasBounds()) {
      let fitted = this._fitWindow(this.state.window);

      if (fitted !== this.state.window) {
        this.setWindow(fitted);
      }
    } else {
      this.state.window = this.state.max_window;
    }
  }

  setWindow(window) {
    if (!window._isADateRangeObject) {
      window = new DateRange(window);
    }

    if (DateRange.eq(window, this.state.window)) {
      return false;
    }

    let fitted = this._fitWindow(window);

    if (DateRange.eq(fitted, this.state.window)) {
      return false;
    }

    this.state.window = fitted;
    this.clearCache();
    return true;
  }

  _getPeopleAtStages(){
    if (this.state._people_at_stages){
      return this.state._people_at_stages;
    }

    let people_at_stages = [["image:bios/ES0.jpg"],
                            ["Thomas Guppy"],
                            ["Nicholas Roch"],
                            ["Isambard Kingdom Brunel"],
                            ["George H. Gibbs"],
                            [],
                            ["Robert Scott"],
                            ["image:bios/ES1.jpg"],
                            ["image:bios/ES2.jpg", "image:bios/ES3.jpg"],
                            ["highlight:Messrs I & J Brown", "image:bios/ES4.jpg"],
                            [],
                            ["image:bios/ES5.jpg", "image:bios/ES6.jpg"],
                            []
                          ];

    this.state._people_at_stages = [];

    people_at_stages.forEach((sequence) => {

      let p = [];

      sequence.forEach((n) => {
        if (n.startsWith("image:")){
          p.push(n.substr(6));
        } else if (n.startsWith("highlight:")){
          let person = null;
          try{
            person = this.getPeople(false).find(n.substr(10));
          } catch(error){}

          if (!person){
            try{
              person = this.getBusinesses(false).find(n.substr(10));
            } catch(error){}
          }

          if (person){
            p.push([person, false]);
          }
        } else {
          let person = null;

          if (n !== null){
            try{
              person = this.getPeople(false).find(n);
            } catch(error){}

            if (!person){
              try{
                person = this.getBusinesses(false).find(n);
              } catch(error){}
            }
          }

          if (person){
            p.push([person, true]);
          }
        }
      });

      this.state._people_at_stages.push(p);
    });

    //console.log(this.state._people_at_stages);

    return this.state._people_at_stages;
  }

  selectAtStage(){
    // return the items associated with the current stage
    let people_at_stages = this._getPeopleAtStages();

    let idx = this.state.filter["date_index"];

    let items = people_at_stages[idx];

    items.forEach((item) => {
      try{
        this.state._displayed_people[item[0].getID()] = 1;
      } catch(error){}
    });

    return items;
  }

  selectAtRandom(){
    // find someone who has only just been filtered in and who has a biography, and select them
    let people = this.getPeople(true);
    let bios = lodash.cloneDeep(this.getBiographies());

    Object.keys(this.state._displayed_people).forEach((key)=>{
      bios.remove(key);
    });

    this._getPeopleAtStages().forEach((person)=>{
      if (person){
        try{
          bios.remove(person.getID());
        } catch(error){}
      }
    });

    let person = people.selectAtRandom(bios);

    if (person){
      this.state._displayed_people[person.getID()] = 1;
    }

    console.log("selectAtRandom");
    console.log(this.state._displayed_people);

    return person;
  }

  getPeople(filtered = true) {
    if (this._rebuilding) {
      filtered = false;
    }

    if (filtered) {
      if (!this.state.cache.people) {
        // console.log("REBUILD PEOPLE");
        this._rebuilding += 1;
        this.state.cache.people = this.state.people.filter(this.getNodeFilters());
        this._rebuilding -= 1;
      }

      /*if (this.state.filter_nc_engineers) {
        this.state.cache.people =
          this.state.cache.people.filterNonContributingEngineers();
      }

      if (this.state.filter_unconnected) {
        this.state.cache.people =
          this.state.cache.people.filterUnconnected(this.getConnections(true));
      }*/

      return this.state.cache.people;
    } else {
      return this.state.people;
    }
  }

  getBusinesses(filtered = true) {
    if (this._rebuilding) {
      filtered = false;
    }

    if (filtered) {
      if (!this.state.cache.businesses) {
        // console.log("REBUILD BUSINESSES");
        this._rebuilding += 1;
        this.state.cache.businesses = this.state.businesses.filter(this.getNodeFilters());
        this._rebuilding -= 1;
      }

      /*if (this.state.filter_nc_engineers) {
        this.state.cache.businesses =
          this.state.cache.businesses.filterNonContributingEngineers();
      }

      if (this.state.filter_unconnected) {
        this.state.cache.businesses =
          this.state.cache.businesses.filterUnconnected(this.getConnections(true));
      }*/

      return this.state.cache.businesses;
    } else {
      return this.state.businesses;
    }
  }

  getConnections(filtered = true) {
    if (this._rebuilding) {
      filtered = false;
    }

    if (filtered) {
      if (!this.state.cache.connections) {
        // console.log("REBUILD CONNECTIONS");
        this._rebuilding += 1;
        this.state.cache.connections = this.state.connections.filter(this.getEdgeFilters());
        this._rebuilding -= 1;
      }

      return this.state.cache.connections;
    } else {
      return this.state.connections;
    }
  }

  getBiographies() {
    return this.state.biographies;
  }

  getAffiliations() {
    return this.state.affiliations;
  }

  getPositions() {
    return this.state.positions;
  }

  getSources() {
    return this.state.sources;
  }

  getNotes() {
    return this.state.notes;
  }

  getProjects() {
    return this.state.projects;
  }

  getConnectionsTo(item) {
    return this.getConnections().getConnectionsTo(item);
  }

  getAnchor() {
    return this.state.anchor;
  }

  getFilter() {
    return {
      ...this.state.filter
    };
  }

  getFilterText() {
    const filter = [];

    let f = this.state.filter.node;

    if (f) {
      let parts = [];

      Object.keys(f).forEach((key) => {
        parts.push(this.get(key, false).getName());
      });

      parts.sort();

      if (parts.length === 1) {
        filter.push(`connected to ${parts[0]}`);
      } else if (parts.length > 1) {
        filter.push(`connected to (${parts.join(" and ")})`);
      }
    }

    f = this.state.filter.source;

    if (f) {
      let parts = [];

      Object.keys(f).forEach((key) => {
        parts.push(this.get(key, false).getName());
      });

      parts.sort();

      if (parts.length === 1) {
        filter.push(`with source ${parts[0]}`);
      } else if (parts.length > 1) {
        filter.push(`with sources (${parts.join(" and ")})`);
      }
    }

    f = this.state.filter.group;

    if (f) {
      let parts = [];

      Object.keys(f).forEach((key) => {
        parts.push(this.get(key, false).getName());
      });

      parts.sort();

      if (parts.length === 1) {
        filter.push(`in group ${parts[0]}`);
      } else if (parts.length > 1) {
        filter.push(`in groups (${parts.join(" and ")})`);
      }
    }

    f = this.state.filter.project;

    if (f) {
      let parts = [];

      Object.keys(f).forEach((key) => {
        parts.push(this.get(key, false).getName());
      });

      parts.sort();

      if (parts.length === 1) {
        filter.push(`in project ${parts[0]}`);
      } else if (parts.length > 1) {
        filter.push(`in projects (${parts.join(" and ")})`);
      }
    }

    if (filter.length === 1) {
      return filter[0];
    } else if (filter.length > 1) {
      return `[${filter.join("] and [")}]`;
    } else {
      return null;
    }
  }

  _getType(item) {
    item = get_id(item);

    if (item[0] === "P" || item[0] === "B") {
      return "node";
    } else if (item[0] === "J") {
      return "project";
    } else if (item[0] === "S") {
      return "source";
    } else {
      return "group";
    }
  }

  isFiltered(item) {
    item = get_id(item);

    let type = this._getType(item);

    const filter = this.state.filter[type];

    if (filter) {
      return item in filter;
    } else {
      return false;
    }
  }

  clearHighlights() {
    this.getPeople(false).clearHighlights();
    this.getBusinesses(false).clearHighlights();
    this.getConnections(false).clearHighlights();
    this.clearCache();
  }

  clearSelections() {
    this.getPeople(false).clearSelections();
    this.getBusinesses(false).clearSelections();
    this.clearCache();
  }

  selectSearchMatching(text, include_bios = false, highlight_links = false) {
    this.clearSelections();
    this.clearHighlights();

    try {
      if (text.length === 0) {
        this.clearCache();
        return;
      }
    }
    catch (error) {
      this.clearCache();
      return;
    }

    let result = [];

    try {
      let items = this.getPeople(true).find(text);
      _push(items, result);
    } catch (error) {
      console.log(error);
    }

    try {
      let items = this.getBusinesses(true).find(text);
      _push(items, result);
    } catch (error) {
      console.log(error);
    }

    if (include_bios) {
      try {
        let items = this.getBiographies().search(text);
        _push(items, result);
      } catch (error) {
        console.log(error);
      }
    }

    let connections = null;

    if (highlight_links) connections = this.getConnections(true);

    result.forEach((item) => {
      item = get_id(item);
      item = this.get(item, false);

      try {
        if (highlight_links) {
          item.setSelected(true);
          connections.highlightConnections(item, this);
        }
        else {
          item.setHighlighted(true);
        }

      } catch (error) {
        console.log(error);
      }
    })

    this.clearCache();
  }

  setSelected(item, highlight_connections = true, clear_previous = true) {
    if (clear_previous) {
      if (highlight_connections) {
        this.clearHighlights();
      }

      this.clearSelections();
    }

    item = get_id(item);
    item = this.get(item, false);

    if (item === null) { return; }

    item.setSelected(true);

    if (highlight_connections) {
      this.getConnections(true).highlightConnections(item, this);
    }

    this.clearCache();
  }

  setHighlighted(item, highlight_connections = true, clear_previous = true) {
    if (clear_previous) {
      this.clearHighlights();
      this.clearSelections();
    }

    item = get_id(item);
    item = this.get(item, false);

    if (item === null) { return; }

    item.setHighlighted(true);

    if (highlight_connections) {
      this.getConnections(true).highlightConnections(item, this);
    }

    this.clearCache();
  }

  isSelected(item) {
    if (item.getID) {
      item = item.getID();
    }

    item = this.get(item, false);

    if (item === null) {
      return false;
    }
    else if (item.getSelected) {
      return item.getSelected();
    }
    else {
      return false;
    }
  }

  isHighlighted(item) {
    if (item.getID) {
      item = item.getID();
    }

    item = this.get(item, false);

    if (item === null) {
      return false;
    }
    else if (item.getHighlighted) {
      return item.getHighlighted();
    }
    else {
      return false;
    }
  }

  find(text) {
    let result = [];

    try {
      let items = this.getPeople(false).find(text);
      _push(items, result);
    } catch (error) {
      console.error(error);
    }

    try {
      let items = this.getBusinesses(false).find(text);
      _push(items, result);
    } catch (error) {
      console.error(error);
    }

    try {
      let items = this.getPositions().find(text);
      _push(items, result);
    } catch (error) {
      console.error(error);
    }

    try {
      let items = this.getAffiliations().find(text);
      _push(items, result);
    } catch (error) {
      console.error(error);
    }

    try {
      let items = this.getSources().search(text);
      _push(items, result);
    } catch (error) {
      console.error(error);
    }

    try {
      let items = this.getBiographies().search(text);
      _push(items, result);
    } catch (error) {
      console.error(error);
    }

    return result;
  }

  resetAllFilters() {
    this.state.filter = {};
    this.clearCache();
  }

  resetFiltersNotShip() {
    const projectFilter = this.state.filter["project"];
    this.state.filter = {};
    this.state.filter["project"] = projectFilter;
    this.clearCache();
  }

  isAnchor(node) {
    let id = get_id(node);

    return id === get_id(this.state.anchor);
  }

  setAnchor(anchor) {
    if (anchor === null) {
      if (this.state.anchor === null) {
        return false;
      } else {
        this.state.anchor = null;
        this.clearCache();
        return true;
      }
    }

    let got_anchor = null;

    if (isString(anchor)) {
      got_anchor = this.get(anchor);
    }

    if (got_anchor) {
      if (got_anchor === this.state.anchor) {
        return false;
      }
      else {
        this.state.anchor = got_anchor;
        this.clearCache();
        return true;
      }
    }

    if (anchor) {
      got_anchor = this.getPeople().find(anchor);
    }

    if (!got_anchor) {
      got_anchor = this.getBusinesses().find(anchor);
    }

    if (!got_anchor) {
      console.log(`CANNOT FIND ANCHOR ${anchor}: ${got_anchor}`);
      return false;
    }

    anchor = got_anchor;

    if (anchor === this.state.anchor) {
      return false;
    }

    this.state.anchor = anchor;
    this.clearCache();
    return true;
  }

  toggleFilter(items) {
    if (!Array.isArray(items)) {
      items = [items];
    }

    for (let item of items) {
      item = get_id(item);

      let type = this._getType(item);

      if (!(type in this.state.filter)) {
        this.state.filter[type] = {};
      }

      if (item in this.state.filter[type]) {
        delete this.state.filter[type][item];

        if (Object.keys(this.state.filter[type]).length === 0) {
          delete this.state.filter[type];
        }
      } else {
        this.state.filter[type][item] = 1;
      }
    }

    this.clearCache();
  }

  setFilter(category, items) {
    if (!Array.isArray(items)) {
      items = [items];
    }

    let filter = {};

    for (let item of items) {
      let id = get_id(item);
      filter[id] = 1;
    }

    this.state.filter[category] = filter;
    this.clearCache();
  }

  setFilters(...args) {
    for (let items of args) {
      if (!Array.isArray(items)) {
        items = [items];
      }

      for (let item of items) {
        item = get_id(item);

        let type = this._getType(item);

        if (!(type in this.state.filter)) {
          this.state.filter[type] = {};
        }

        this.state.filter[type][item] = 1;
      }
    }

    this.clearCache();
  }

  clearFilters(...args) {
    for (let items of args) {
      if (!Array.isArray(items)) {
        items = [items];
      }

      for (let item of items) {
        item = get_id(item);

        let type = this._getType(item);

        if (item in this.state.filter[type]) {
          delete this.state.filter[type][item];

          if (Object.keys(this.state.filter[type]).length === 0) {
            delete this.state.filter[type];
          }
        }
      }
    }

    this.clearCache();
  }

  toggleNodeFilter(nodes) {
    this.toggleFilter(nodes);
  }

  clearProjectFilter() {
    this.state.filter["project"] = {};
  }

  toggleProjectFilter(project) {
    if (!("project" in this.state.filter)) {
      this.state.filter["project"] = {};
    }

    if (project in this.state.filter["project"]) {
      delete this.state.filter["project"][project];
    } else {
      this.state.filter["project"][project] = 1;
    }
  }

  getProjectTimeLine() {
    if (this.state.cache.projectTimeLine !== null) {
      return this.state.cache.projectTimeLine;
    }

    let items = this.getProjects().getTimeLine();

    this.state.cache.projectTimeLine = items;

    return this.state.cache.projectTimeLine;
  }

  getItemTimeLine() {
    if (this.state.cache.itemTimeLine !== null) {
      return this.state.cache.itemTimeLine;
    }

    let items = this.getPeople().getTimeLine();

    let projects = this.getProjects().getTimeLine();

    projects.forEach((item) => {
      item.type = "background";
      items.push(item);
    });

    this.state.cache.itemTimeLine = items;

    return this.state.cache.itemTimeLine;
  }

  /** Set the scoring function used to order the nodes */
  setScoringFunction(func) {
    if (func !== this.state.scoring_function) {
      this.state.scoring_function = func;
      this.clearCache();
    }
  }

  /** Return the scoring function that should be used to order the
   *  nodes in any ordered graph
   */
  getScoringFunction() {
    return this.state.scoring_function;
  }

  /** Set the sizing function used to size the nodes */
  setSizingFunction(func) {
    if (func !== this.state.sizing_function) {
      this.state.sizing_function = func;
      this.clearCache();
    }
  }

/** Return the sizing function that should be used to size the nodes */
  getSizingFunction() {
    return this.state.sizing_function;
  }

  /** Return the graph of nodes and edges that will be displayed by
   *  the app. This should apply all of the filters and only return
   *  the nodes and edges that should be visible. It should also
   *  apply the indexing function so that the index of the nodes
   *  show their sorted order according to the primary criterion
   */
  getGraph() {
    if (this.state.cache.graph !== null) {
      return this.state.cache.graph;
    }

    let nodes = this.getPeople().getNodes();
    nodes = nodes.concat(this.getBusinesses().getNodes());

    // create a dictionary so we know which nodes are selected
    let n = {};
    for (let i in nodes) {
      n[get_id(nodes[i])] = 1;
    }

    // get only the edges that involve these nodes
    let edges = this.getConnections().getEdges(n);

    // let each node know how many connections it has got
    let counts = {};

    let add_count = (id) => {
      // ensures x == 1 if id doesn't exist in counts
      let x = (counts[id] || 0) + 1;
      counts[id] = x;
    };

    for (let i in edges) {
      add_count(edges[i].source);
      add_count(edges[i].target);
    }

    nodes.forEach((node) => {
      let count = counts[node.id];

      if (!count) { count = 0; }
      node.edge_count = count;
    });

    let scoring_function = this.getScoringFunction();

    if (!scoring_function) {
      scoring_function = score_by_influence;
    }

    scoring_function(nodes, edges, this);

    let sizing_function = this.getSizingFunction();

    if (!sizing_function) {
      sizing_function = size_by_weight;
    }

    sizing_function(nodes, edges, this);

    this.state.cache.graph = {
      nodes: nodes,
      edges: edges
    };
    return this.state.cache.graph;
  }

  add(item) {
    if (!item) {
      return;
    }

    let added = false;

    Object.keys(this.state).forEach((key) => {
      if (!added) {
        let group = this.state[key];
        if (group && group.canAdd) {
          if (group.canAdd(item)) {
            group.add(item);
            added = true;
          }
        }
      }
    });

    if (!added) {
      throw new ValueError(`Do not know how to add ${item} to this Social group`);
    }
  }

  get(id, filtered = true) {
    id = get_id(id);

    if (this._rebuilding) {
      // we cannot get filtered data when rebuilding, else otherwise
      // we get race conditions and weird results
      filtered = false;
    }

    try {
      if (id[0] === "C") {
        return this.getConnections(filtered).get(id);
      } else if (id[0] === "P") {
        return this.getPeople(filtered).get(id);
      } else if (id[0] === "B") {
        return this.getBusinesses(filtered).get(id);
      } else if (id[0] === "Q") {
        return this.getPositions().get(id);
      } else if (id[0] === "A") {
        return this.getAffiliations().get(id);
      } else if (id[0] === "S") {
        return this.getSources().get(id);
      } else if (id[0] === "N") {
        return this.getNotes().get(id);
      } else if (id[0] === "J") {
        return this.getProjects().get(id);
      } else {
        return id;
      }
    } catch (error) {
      if (filtered) {
        return this.get(id, false);
      } else {
        throw error;
      }
    }
  }

  toDry() {
    return {
      value: this.state
    };
  }
}

Social.unDry = function (value) {
  let social = new Social(value);
  social._updateHooks();

  return social;
};

Dry.registerClass("Social", Social);

export default Social;