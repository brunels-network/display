// package imports
import React from "react";
import Dry from "json-dry";

// Brunel components
import ForceGraph from "./components/ForceGraph";
import ShipSelector from "./components/ShipSelector";
import TextButton from "./components/TextButton";
import LabelButton from "./components/LabelButton";
import HowDoIOverlay from "./components/HowDoIOverlay";
import Overlay from "./components/Overlay";
import SearchBar from "./components/SearchBar";
import BioOverlay from "./components/BioOverlay";
import ImageOverlay from "./components/ImageOverlay";
import BlankScreen from "./components/BlankScreen";
import ShipOverlay from "./components/ShipOverlay";
import SlidingPanel from "./components/SlidingPanel";
import MainMenu from "./components/MainMenu";
import WarningOverlay from "./components/WarningOverlay";
import KeyDatesBox from "./components/KeyDatesBox";
import PlayPause from "./components/PlayPause";

import HBox from "./components/HBox";
import VBox from "./components/VBox";
import BigBox from "./components/BigBox";

// Brunel model
import Social from "./model/Social";

// Data for import
import graphData from "./socialNetwork.json";
import positionGroups from "./data/positionGroups.json";
import imageData from "./images.json";

// Styling for the app
import styles from "./SocialApp.module.css";

import { score_by_connections, score_by_influence } from "./model/ScoringFunctions";

import { size_by_connections, size_by_influence, size_by_weight } from "./model/SizingFunctions";

class SocialApp extends React.Component {
  constructor(props) {
    super(props);

    // Load in the Dried graph data from JSON
    let social = Dry.parse(graphData);

    if (!(social instanceof Social)) {
      console.error("Could not parse!");
      social = new Social();
    }

    this.updateSize = this.updateSize.bind(this);

    this.state = {
      social: social,
      highlighted_item: null,
      selected_item: null,
      filterUnconnectedNodes: true,
      filterNCEngineers: true,
      commercialFiltered: false,
      engineersFiltered: false,
      spiralOrder: "Influence",
      nodeSize: "Influence",
      commercialNodeFilter: [],
      engineerNodeFilter: [],
      connectedNodes: null,
      selectedShip: null,
      selectedShipID: null,
      isOverlayOpen: false,
      searchText: "",
      searchIncludeBios: true,
      searchHighlightLinks: false,
      menuVisible: false,
      height: 0,
      width: 0,
      date_index: 0,
      warningVisible: true,
      firstload: true,
    };


    try {
      Object.keys(imageData).forEach((key) => {
        social.setImage(key, imageData[key][0], imageData[key][1]);
     });
    } catch (error) {
      console.log("CANNOT ADD IMAGE!");
      console.log(error);
    }

    const gwr = social.getProjects().getByName("GWR");

    // make sure that we start showing only the Great Western
    this.state.social.toggleFilter(gwr);

    this.spiralOrders = Object.freeze({
      Connections: score_by_connections,
      Influence: score_by_influence,
    });

    this.nodeSizes = Object.freeze({
      Influence: size_by_influence,
      Connections: size_by_connections,
    });

    this.state.social.setSizingFunction(size_by_weight);

    // Find the investors and engineers for easy filtering
    // This requires the
    this.findInvestorsAndEngineers();

    this.state.social.setScoringFunction(score_by_influence);

    this.slotSetDateIndex(0);

    this.socialGraph = null;
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateSize);
    this.updateSize();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateSize);
  }

  updateSize() {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });

  }

  slotSetAnchor(item) {
    let social = this.state.social;

    if (social.setAnchor(item)) {
      this.setState({ social: social });
    }
  }

  slotReadMore(item) {
    this.setOverlay(
      <BioOverlay
        close={() => {
          this.closeOverlay();
        }}
        social={this.state.social}
        person={item}
      />
    );
  }

  slotShowImage(image){
    this.setOverlay(
      <ImageOverlay
        close={() => {
          this.closeOverlay();
        }}
        image={image}
      />
    );
  }

  slotShowShip(item) {
    this.setOverlay(
      <ShipOverlay
        close={() => {
          this.closeOverlay();
        }}
        social={this.state.social}
        ship={item}
      />
    );
  }

  slotSetShip(item) {
    if (!item._isAProjectObject) {
      console.error("Cannot set item that is not a project.");
      return;
    }

    let social = this.state.social;
    social.setFilter("project", item);

    social.setDefaultImage(social.getImage(item));

    if (this.state.searchText && this.state.searchText.length > 0) {
      if (this.state.searchWasItem) {
        social.selectSearchMatching(this.state.searchText, false, true);
      } else {
        social.selectSearchMatching(
          this.state.searchText,
          this.state.searchIncludeBios,
          this.state.searchHighlightLinks
        );
      }
    }

    this.setState({ selectedShip: item.getName(), selectedShipID: item.getID() });
    this.setState({ social: social });
  }

  slotClearFilters() {
    let social = this.state.social;
    social.resetAllFilters();
    social.setFilter("project", this.state.selectedShipID);

    social.filterUnconnectedNodes(true);
    social.filterNonContributingEngineers(true);

    if (this.state.searchText && this.state.searchText.length > 0) {
      if (this.state.searchWasItem) {
        social.selectSearchMatching(this.state.searchText, false, true);
      } else {
        social.selectSearchMatching(
          this.state.searchText,
          this.state.searchIncludeBios,
          this.state.searchHighlightLinks
        );
      }
    }

    this.setState({
      social: social,
      engineersFiltered: false,
      commercialFiltered: false,
      filterUnconnectedNodes: true,
      filterNCEngineers: true,
    });
  }

  toggleEngCommFilter() {
    if (this.state.engineersFiltered) {
      this.slotToggleFilterCommercial();
    } else if (this.state.commercialFiltered) {
      this.slotToggleFilterCommercial();
    } else {
      this.slotToggleFilterEngineer();
    }
  }

  slotToggleNonContributingEngineers() {
    let social = this.state.social;

    social.resetAllFilters();
    social.setFilter("project", this.state.selectedShipID);

    if (this.state.engineersFiltered) {
      social.toggleFilter(this.state.engineerNodeFilter);
    } else if (this.state.commercialFiltered) {
      social.toggleFilter(this.state.commercialNodeFilter);
    }

    social.filterUnconnectedNodes(this.state.filterUnconnectedNodes);
    social.filterNonContributingEngineers(!this.state.filterNCEngineers);

    if (this.state.searchText && this.state.searchText.length > 0) {
      if (this.state.searchWasItem) {
        social.selectSearchMatching(this.state.searchText, false, true);
      } else {
        social.selectSearchMatching(
          this.state.searchText,
          this.state.searchIncludeBios,
          this.state.searchHighlightLinks
        );
      }
    }

    this.setState({
      social: social,
      filterNCEngineers: !this.state.filterNCEngineers,
    });
  }

  slotToggleUnconnectedNodes() {
    let social = this.state.social;

    social.resetAllFilters();
    social.setFilter("project", this.state.selectedShipID);

    if (this.state.engineersFiltered) {
      social.toggleFilter(this.state.engineerNodeFilter);
    } else if (this.state.commercialFiltered) {
      social.toggleFilter(this.state.commercialNodeFilter);
    }

    social.filterUnconnectedNodes(!this.state.filterUnconnectedNodes);
    social.filterNonContributingEngineers(this.state.filterNCEngineers);

    if (this.state.searchText && this.state.searchText.length > 0) {
      if (this.state.searchWasItem) {
        social.selectSearchMatching(this.state.searchText, false, true);
      } else {
        social.selectSearchMatching(
          this.state.searchText,
          this.state.searchIncludeBios,
          this.state.searchHighlightLinks
        );
      }
    }

    this.setState({
      social: social,
      filterUnconnectedNodes: !this.state.filterUnconnectedNodes,
    });
  }

  slotToggleFilterEngineer() {
    let social = this.state.social;

    social.resetAllFilters();
    social.setFilter("project", this.state.selectedShipID);

    if (!this.state.engineersFiltered) {
      social.toggleFilter(this.state.engineerNodeFilter);
    }

    social.filterUnconnectedNodes(this.state.filterUnconnectedNodes);
    social.filterNonContributingEngineers(this.state.filterNCEngineers);

    if (this.state.searchText && this.state.searchText.length > 0) {
      if (this.state.searchWasItem) {
        social.selectSearchMatching(this.state.searchText, false, true);
      } else {
        social.selectSearchMatching(
          this.state.searchText,
          this.state.searchIncludeBios,
          this.state.searchHighlightLinks
        );
      }
    }

    this.setState({
      social: social,
      engineersFiltered: !this.state.engineersFiltered,
      commercialFiltered: false,
    });
  }

  slotToggleFilterCommercial() {
    let social = this.state.social;

    social.resetAllFilters();
    social.setFilter("project", this.state.selectedShipID);

    if (!this.state.commercialFiltered) {
      social.toggleFilter(this.state.commercialNodeFilter);
    }

    social.filterUnconnectedNodes(this.state.filterUnconnectedNodes);
    social.filterNonContributingEngineers(this.state.filterNCEngineers);

    if (this.state.searchText && this.state.searchText.length > 0) {
      if (this.state.searchWasItem) {
        social.selectSearchMatching(this.state.searchText, false, true);
      } else {
        social.selectSearchMatching(
          this.state.searchText,
          this.state.searchIncludeBios,
          this.state.searchHighlightLinks
        );
      }
    }

    this.setState({
      social: social,
      commercialFiltered: !this.state.commercialFiltered,
      engineersFiltered: false,
    });
  }

  slotClicked(id) {
    let social = this.state.social;

    if (!id) {
      let last_search = this.state.cachedSearch;

      if (last_search === "") {
        social.clearSelections();
        social.clearHighlights();
        this.setState({
          social: social,
          searchText: "",
          cachedSearch: "",
          searchWasItem: false,
          selectedPerson: null,
        });
      } else {
        this.performSearch(this.state.cachedSearch, this.state.searchIncludeBios, this.state.searchHighlightLinks);
      }
    } else {
      let item = social.get(id);

      social.setSelected(id, true, true);
      this.setState({
        social: social,
        searchText: item.getName(),
        searchWasItem: true,
        selectedPerson: item,
      });
    }
  }

  slotWindowChanged(window) {
    let social = this.state.social;

    if (social.setWindow(window)) {
      this.setState({ social: social });
    }
  }

  hasConnections(entity) {
    return this.state.social.getConnections().gotConnections(entity.id);
  }

  findInvestorsAndEngineers() {
    // Add nodes to the commercial or engineering groups. This
    // creates filters that filter positions that we've matched
    // as benig "engineer" or "commercial"
    let commercialNodeFilter = this.state.commercialNodeFilter;
    let engineerNodeFilter = this.state.engineerNodeFilter;

    const social = this.state.social;

    let positions = social.getPositions(false).items();

    Object.keys(positions).forEach((name) => {
      // Trim any extra characters or whitespace from the position string
      const namedPosition = name
        .toLowerCase()
        .replace(/\s/g, "")
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

      // Here we need to check if they've already been saved to stop double counting
      if (positionGroups["commercial"]["members"].includes(namedPosition)) {
        const positionID = positions[name];
        if (!commercialNodeFilter.includes(positionID)) {
          commercialNodeFilter.push(positionID);
        }
      }

      if (positionGroups["engineering"]["members"].includes(namedPosition)) {
        const positionID = positions[name];
        if (!engineerNodeFilter.includes(positionID)) {
          engineerNodeFilter.push(positionID);
        }
      }
    });
  }

  toggleSpiralOrder() {
    const order = this.state.spiralOrder;

    if (order === "Influence") {
      this.setSpiralOrder("Connections");
    } else if (order === "Connections") {
      this.setSpiralOrder("Influence");
    }
  }

  setSpiralOrder(order) {
    if (order in this.spiralOrders) {
      if (this.state.spiralOrder !== order) {
        let social = this.state.social;
        social.setScoringFunction(this.spiralOrders[order]);
        this.setState({
          social: social,
          spiralOrder: order,
        });
      }
    } else {
      console.error("Invalid spiral order, valid orders are ", Object.keys(this.spiralOrders));
    }
  }

  toggleNodeSize() {
    const size = this.state.nodeSize;

    if (size === "Influence") {
      this.setNodeSize("Connections");
    } else if (size === "Connections") {
      this.setNodeSize("Influence");
    }
  }

  setNodeSize(size) {
    if (size in this.nodeSizes) {
      if (this.state.nodeSize !== size) {
        let social = this.state.social;
        social.setSizingFunction(this.nodeSizes[size]);
        this.setState({
          social: social,
          nodeSize: size,
        });
      }
    } else {
      console.error("Invalid sizing function, valid functions are ", Object.keys(this.nodeSizes));
    }
  }

  setOverlay(item) {
    this.setState({
      overlayItem: item,
      isOverlayOpen: true,
    });
  }

  closeOverlay() {
    this.setState({
      isOverlayOpen: false,
      overlayItem: null,
    });
  }

  performSearch(text, include_bios, highlight_links) {
    let social = this.state.social;

    social.selectSearchMatching(text, include_bios, highlight_links);

    this.setState({
      social: social,
      searchIncludeBios: include_bios,
      searchHighlightLinks: highlight_links,
      searchText: text,
      searchWasItem: false,
      cachedSearch: text,
    });
  }

  slotCloseWarning() {
    this.setState({ warningVisible: false });
  }

  slotShowMenu() {
    this.setState({ menuVisible: true });
  }

  slotCloseMenu() {
    this.setState({ menuVisible: false });
  }

  slotUpdateSearch(text) {
    this.performSearch(text, this.state.searchIncludeBios, this.state.searchHighlightLinks);
  }

  slotSearchBiosToggled(toggled) {
    if (this.state.searchWasItem) {
    } else {
      this.performSearch(this.state.searchText, toggled, this.state.searchHighlightLinks);
    }
  }

  slotSearchHighlightToggled(toggled) {
    if (this.state.searchWasItem) {
    } else {
      this.performSearch(this.state.searchText, this.state.searchIncludeBios, toggled);
    }
  }

  slotSetDateIndex(date_index) {
    date_index = this.state.social.getKeyDates().wrapIndex(date_index);
    let social = this.state.social;
    social.setKeyDateFilter(date_index);
    this.setState({date_index: date_index,
                   social: social});
  }

  nextFrame(){
    // find someone to highlight
    let date_index = this.state.date_index;
    let frame_count = this.state.frame_count;
    let item_index = this.state.item_index;
    let item_frame = this.state.item_frame;

    if (!frame_count){
      frame_count = 0;
    }

    if (!item_index){
      item_index = 0;
    }

    if (!item_frame){
      item_frame = 0;
    }

    let social = this.state.social;
    let items = social.selectAtStage();

    frame_count += 1;

    if (frame_count < 0){
      // still pausing
    } else if (frame_count === 0){
      // pause after the blank screen
      item_index = 0;
      item_frame = 0;
      this.closeOverlay();
      this.slotClicked(null);
    } else if (item_index >= items.length) {
      // Blank the screen if this is the end of the show
      date_index = this.state.social.getKeyDates().wrapIndex(date_index + 1);
      this.slotSetDateIndex(date_index);

      item_index = 0;
      item_frame = 0;

      if (date_index !== 0){
        frame_count = 0;
      } else {
        frame_count = -2;
        this.slotBlankScreen();
      }
    } else {
      let item = items[item_index];

      /*if (item_frame === 0){
        this.slotClicked(null);
        this.closeOverlay();
      }*/

      if (typeof item === 'string'){

        if (item_frame === 0){
          try{
            this.slotShowImage(`images/${item}`);
          } catch(error){}
        }

        if (item_frame >= 2) {
          item_index += 1;
          item_frame = 0;

          if (item_index >= items.length){
            this.slotClicked(null);
            this.closeOverlay();
          } else {
            try{
              this.slotShowImage(`images/${item}`);
            } catch(error){}
          }
        } else {
          item_frame += 1;
        }

      } else {
        try{
          let person = item[0];
          let show_bio = item[1];

          if (item_frame === 0){
            this.slotClicked(person);
            item_frame += 1;
          } else {
            if (show_bio){
              if (item_frame === 1){
                this.slotReadMore(person);
                item_frame += 1;
              } else if (item_frame > 2) {
                this.closeOverlay();
                item_index += 1;
                item_frame = 0;
              } else {
                item_frame += 1;
              }
            } else {
              if (item_frame > 1){
                item_index += 1;
                item_frame = 0;
              } else {
                item_frame += 1;
              }
            }
          }
        } catch(error) {}
      }
    }

    this.setState({frame_count: frame_count,
                   item_index: item_index,
                   item_frame: item_frame});
  }

  slotPlay() {
    if (this.interval){
      return;
    }

    this.setState({frame_count: 0,
                   item_index: 0,
                   item_frame: 0});

    this.interval = setInterval(()=>{this.nextFrame()}, 5000);
  }

  slotPause() {
    this.setState({frame_count: 0});

    if (this.interval){
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  slotBlankScreen(){
    this.setOverlay(<BlankScreen/>);
  }

  toggleOverlay() {
    this.setState({ isOverlayOpen: !this.state.isOverlayOpen });
  }

  resetAll() {
    window.location.reload(true);
  }

  render() {

    if (this.state.firstload){
      this.slotPlay();
      this.setState({firstload: false});
    }

    let graph = (
      <ForceGraph
        social={this.state.social}
        selected={this.state.selected_item}
        highlighted={this.state.highlighted_item}
        signalClicked={(id) => this.slotClicked(id)}
        emitSetCenter={(id) => {
          this.slotSetAnchor(id);
        }}
        emitReadMore={(id) => {
          this.slotReadMore(id);
        }}
      />
    );

    let overlay = null;
    if (this.state.isOverlayOpen) {
      overlay = (
        <Overlay
          toggleOverlay={() => {
            this.toggleOverlay();
          }}
        >
          {this.state.overlayItem}
        </Overlay>
      );
    }

    return (
      <div>
        <div className={styles.ui_main}>
          <VBox>
            <BigBox>
              <div className={styles.fullscreen}>{graph}</div>
            </BigBox>
            <KeyDatesBox
              social={this.state.social}
              index={this.state.date_index}
              signalSetDateIndex={(date_index) => this.slotSetDateIndex(date_index)}
            />
            <PlayPause signalPlay={()=>this.slotPlay()}
                       signalPause={()=>this.slotPause()} />
          </VBox>
        </div>
        {overlay}
      </div>
    );
  }
}

export default SocialApp;
