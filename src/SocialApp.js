// package imports
import React from "react";
import Dry from "json-dry";

// Brunel components
import AnalysisPanel from "./components/AnalysisPanel";
import AnalysisButton from "./components/AnalysisButton";
import SocialGraph from "./components/SocialGraph";
import InfoBox from "./components/InfoBox";
import TimeLineBox from "./components/TimeLineBox";
import FilterBox from "./components/FilterBox";
import SlidingPanel from "./components/SlidingPanel";
import ShipSelector from "./components/ShipSelector";
import ShipTitle from "./components/ShipTitle";
import SearchOverlay from "./components/SearchOverlay";
import TextButton from "./components/TextButton";
import Overlay from "./components/Overlay";

// Brunel model
import Social from "./model/Social";

// Data for import
import graphData from "./dataWeights.json";
import positionGroups from "./data/positionGroups.json";

// Styling for the app
import styles from "./SocialApp.module.css";
import DateRange from "./model/DateRange";

class SocialApp extends React.Component {
  constructor(props) {
    super(props);

    this.togglePhysicsEnabled = this.togglePhysicsEnabled.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
    this.setOverlay = this.setOverlay.bind(this);
    this.toggleOverlay = this.toggleOverlay.bind(this);

    // Load in the Dried graph data from JSON
    let social = Dry.parse(graphData);

    if (!(social instanceof Social)) {
      console.error("Could not parse!");
      social = new Social();
    }

    // Special cases for Brunel project...
    social.setAnchor("Brunel");
    social.setMaxWindow(new DateRange({ start: "1800-01-01", end: "1860-12-31" }));

    this.state = {
      social: social,
      highlighted_item: null,
      selected_item: null,
      overlayItem: null,
      isInfoPanelOpen: false,
      isTimeLinePanelOpen: false,
      isFilterPanelOpen: false,
      isHamburgerMenuOpen: false,
      isSearchOverlayOpen: false,
      isOptionsOverlayOpen: false,
      indirectConnectionsVisible: false,
      unconnectedNodesVisible: false,
      investorsFiltered: false,
      engineersFiltered: false,
      commericalNodeFilter: [],
      engineerNodeFilter: [],
      unconnectedNodes: null,
      timeline: new TimeLineBox(),
      isOverlayOpen: false,
      isAnalysisOpen: false,
      physicsEnabled: false,
      selectedShip: null,
      selectedShipID: null,
      commercialNodes: null,
      engineeringNodes: null,
    };

    // TODO - work out a cleaner way of doing this
    // Is set in ShipSelector correctly
    const ssGW = social.getProjects().getByName("SS Great Western");
    this.state.selectedShip = ssGW.getName();
    this.state.selectedShipID = ssGW.getID();

    // Find the investors and engineers for easy filtering
    // This requires the
    this.findInvestorsAndEngineers();
    // Find the unconnected nodes for filtering
    this.findUnconnectedNodes();

    // Hide the unconnected nodes
    // this.toggleUnconnectedNodesVisible();
    // setState doesn't fire as called from ctor so change it here
    // this.state.unconnectedNodesVisible = true;

    this.socialGraph = null;

    console.log("After ctor ", this.state.social.state.filter);
  }

  resetFilters() {
    let social = this.state.social;
    social.resetFilters();
    this.setState({ social: social });
    // this.setState({ social: social, selectedShip: null, selectedShipID: null });
  }

  closePanels() {
    this.setState({
      isInfoPanelOpen: false,
      isTimeLinePanelOpen: false,
      isHamburgerMenuOpen: false,
      isFilterPanelOpen: false,
      isAnalysisOpen: false,
      highlighted_item: null,
    });
  }

  closeOverlay() {
    this.setState({
      isOverlayOpen: false,
      overlayItem: null,
    });
  }

  showInfo(item) {
    if (item._isAProjectObject) {
      this.setState({
        overlayItem: item,
        isOverlayOpen: true,
      });
    } else {
      this.setState({
        selected_item: item,
        isInfoPanelOpen: true,
      });
    }
  }

  slotClearFilters() {
    this.resetFilters();
  }

  slotSetFilter(item) {
    this.setState({ selectedShip: item.getName(), selectedShipID: item.getID() });
    this.slotToggleFilter(item);
  }

  //   clearShipSelection() {
  //     this.setState({ selectedShip: null, selectedShipID: null });
  //   }

  slotSetFilterbyID(id, name) {
    // this.resetFilters();
    this.setState({ selectedShip: name, selectedShipID: id });
    this.slotToggleFilter(id);
  }

  slotToggleProjectFilter(project) {
    let social = this.state.social;
    social.toggleProjectFilter(project);

    this.setState({ social: social });
  }

  slotToggleFilter(item) {
    if (!item) {
      return;
    }

    let social = this.state.social;

    // This feels clunky, is there a cleaner way of doing this?
    // Currently we only want one ship selectable at a time
    if (item._isAProjectObject) {
      social.clearProjectFilter();
    }

    social.toggleFilter(item);

    this.setState({ social: social });
  }

  slotHighlighted(id) {
    if (!id) {
      return;
    }

    if (id._isADateRangeObject) {
      return;
    }

    this.setState({ highlighted_item: id });
  }

  slotSelected(id) {
    if (!id) {
      this.closePanels();
      return;
    }

    if (id._isADateRangeObject) {
      let social = this.state.social;
      if (social.setWindow(id)) {
        this.setState({ social: social });
      }
      return;
    }

    const social = this.state.social;
    const item = social.get(id);
    this.showInfo(item);
  }

  slotWindowChanged(window) {
    let social = this.state.social;

    if (social.setWindow(window)) {
      this.setState({ social: social });
    }
  }

  gotConnections(id) {
    // Does this have node have any connections, returns bool
    return this.state.social.getConnections().gotConnections(id);
  }

  findInvestorsAndEngineers() {
    // Creates a list of the IDs of all the nodes that belong to the commercial
    // side of the projects
    const people = this.state.social.getPeople(false).getRegistry();
    const businesses = this.state.social.getBusinesses(false).getRegistry();

    this.findAndGroupNodes(people);
    this.findAndGroupNodes(businesses);
  }

  findAndGroupNodes(entities) {
    // Add nodes to the commercial or engineering groups
    let commericalNodeFilter = this.state.commericalNodeFilter;
    let engineerNodeFilter = this.state.engineerNodeFilter;

    const social = this.state.social;

    for (const [id, entity] of Object.entries(entities)) {
      // Should do this for each ship
      for (const shipID of social.getProjects().getIDs()) {
        // Lookup named position, here we'll only use the first position
        // As each person may not have a role in every ship catch the error here
        let positionID;
        try {
          positionID = entity.getPosition(shipID)[0];
        } catch (error) {
          continue;
        }

        // Trim any extra characters or whitespace from the position string
        const namedPosition = social
          .getPositions()
          .getNameByID(positionID)
          .toLowerCase()
          .replace(/\s/g, "")
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

        // Here we need to check if they've already been saved to stop double counting
        if (positionGroups["commercial"]["members"].includes(namedPosition)) {
          if (!commericalNodeFilter.includes(id)) {
            commericalNodeFilter.push(id);
          }
        }

        if (positionGroups["engineering"]["members"].includes(namedPosition)) {
          if (!engineerNodeFilter.includes(id)) {
            engineerNodeFilter.push(id);
          }
        }
      }
    }
  }

  findUnconnectedNodes() {
    // Loop through and find the unconnected nodes and create a list of them
    let unconnectedNodes = [];

    const people = this.state.social.getPeople().getNodes("noanchor");

    for (const p of people) {
      if (this.gotConnections(p.id)) {
        unconnectedNodes.push(p.id);
      }
    }

    const businesses = this.state.social.getBusinesses().getNodes("noanchor");

    for (const b of businesses) {
      if (this.gotConnections(b.id)) {
        unconnectedNodes.push(b.id);
      }
    }

    this.state.unconnectedNodes = unconnectedNodes;
  }

  toggleUnconnectedNodesVisible() {
    this.slotToggleFilter(this.state.unconnectedNodes);
    this.setState({ unconnectedNodesVisible: !this.state.unconnectedNodesVisible });
  }

  filterEngineeringNodes() {
    if (this.state.investorsFiltered) {
      this.filterInvestorNodes();
    }

    this.slotToggleFilter(this.state.engineerNodeFilter);
    this.setState({ engineersFiltered: !this.state.engineersFiltered });
  }

  filterInvestorNodes() {
    if (this.state.engineersFiltered) {
      this.filterEngineeringNodes();
    }

    this.slotToggleFilter(this.state.commericalNodeFilter);
    this.setState({ investorsFiltered: !this.state.investorsFiltered, engineersFiltered: false });
  }

  toggleInfoPanel() {
    this.setState({ isInfoPanelOpen: !this.state.isInfoPanelOpen });
  }

  toggleTimeLinePanel() {
    this.setState({
      isFilterPanelOpen: false,
      isTimeLinePanelOpen: !this.state.isTimeLinePanelOpen,
    });
  }

  toggleFilterPanel() {
    this.setState({
      isTimeLinePanelOpen: false,
      isFilterPanelOpen: !this.state.isFilterPanelOpen,
    });
  }

  toggleAnalysisPanel() {
    this.setState({ isAnalysisOpen: !this.state.isAnalysisOpen });
  }

  toggleSearchOverlay() {
    this.setState({ isSearchOverlayOpen: !this.state.isSearchOverlayOpen });
  }

  togglePhysicsEnabled() {
    this.setState({ physicsEnabled: !this.state.physicsEnabled });
  }

  toggleOptionsOverlay() {
    this.setState({ isOptionsOverlayOpen: !this.state.isOptionsOverlayOpen });
  }

  toggleindirectConnectionsVisible() {
    this.setState({ indirectConnectionsVisible: !this.state.indirectConnectionsVisible });
  }

  setOverlay(item) {
    this.setState({
      overlayItem: item,
      isOverlayOpen: true,
    });
  }

  toggleOverlay() {
    this.setState({ isOverlayOpen: !this.state.isOverlayOpen });
  }

  resetAll() {
    window.location.reload(true);
  }

  render() {
    const selected = this.state.selected_item;
    const highlighted = this.state.highlighted_item;
    const overlayItem = this.state.overlayItem;
    const social = this.state.social;

    // Check if we should be toggling the unconnected nodes
    // if(!this.state.unconnectedNodesVisible)

    let searchOverlay = null;

    if (this.state.isSearchOverlayOpen) {
      searchOverlay = (
        <SearchOverlay
          social={social}
          toggleSearchOverlay={() => this.toggleSearchOverlay()}
          emitSelected={(item) => {
            this.slotSelected(item);
          }}
          emitHighlighted={(item) => {
            this.slotHighlighted(item);
          }}
          emitClicked={(item) => {
            this.slotClicked(item);
          }}
          selectedShipID={this.state.selectedShipID}
        />
      );
    }

    let overlay = null;
    if (this.state.isOverlayOpen) {
      overlay = <Overlay toggleOverlay={this.toggleOverlay}>{this.state.overlayItem}</Overlay>;
    }

    return (
      <div>
        <div className={styles.resetButtonContainer}>
          <TextButton fontSize="28px" hoverColor="#9CB6A4" padding="2px 2px 2px 2px" onClick={() => this.resetAll()}>
            Reset
          </TextButton>
        </div>

        <SlidingPanel isOpen={this.state.isTimeLinePanelOpen} position="bottom" height="15%">
          <span
            className={styles.closePanelButton}
            onClick={() => {
              this.setState({ isTimeLinePanelOpen: false });
            }}
          >
            X
          </span>
          <TimeLineBox
            selected={selected}
            projects={this.state.social.getProjects()}
            shipSelect={(item) => {
              this.slotSetFilter(item);
            }}
            resetFilters={this.resetFilters}
          />
        </SlidingPanel>

        {/* Info panel on the RHS */}
        <SlidingPanel isOpen={this.state.isInfoPanelOpen} position="right">
          <span
            className={styles.closePanelButton}
            onClick={() => {
              this.setState({ isInfoPanelOpen: false });
            }}
          >
            X
          </span>
          <InfoBox
            item={selected}
            social={social}
            emitSelected={(item) => {
              this.slotSelected(item);
            }}
            emitHighlighted={(item) => {
              this.slotHighlighted(item);
            }}
            emitToggleFilter={(item) => {
              this.slotToggleFilter(item);
            }}
          />
        </SlidingPanel>

        {/* Filter on bottom of page */}
        <SlidingPanel isOpen={this.state.isFilterPanelOpen} position="bottom" height="25%">
          <span
            className={styles.closePanelButton}
            onClick={() => {
              this.setState({ isFilterPanelOpen: false });
            }}
          >
            X
          </span>
          <FilterBox
            social={social}
            emitToggleFilter={(item) => {
              this.slotToggleFilter(item);
            }}
            emitSelected={(item) => {
              this.slotSelected(item);
            }}
            emitHighlighted={(item) => {
              this.slotHighlighted(item);
            }}
            emitClearFilters={() => {
              this.slotClearFilters();
            }}
          />
        </SlidingPanel>

        <div className={styles.shipNameContainer}>
          <ShipTitle name={this.state.selectedShip} />
        </div>

        <div className={styles.bottomContainer}>
          <ShipSelector
            projects={this.state.social.getProjects()}
            shipFilter={(item) => this.slotSetFilter(item)}
            resetFilters={this.resetFilters}
            selectedShip={this.state.selectedShip}
          />
        </div>

        {/* The social graph itself */}
        <div className={styles.mainContainer}>
          <div className={styles.graphContainer}>
            <SocialGraph
              social={this.state.social}
              selected={selected}
              highlighted={highlighted}
              emitClicked={(id) => this.slotSelected(id)}
              setOverlay={this.setOverlay}
              wobble={this.state.wobbleEnabled}
              selectedShipID={this.state.selectedShipID}
              indirectConnectionsVisible={this.state.indirectConnectionsVisible}
              physicsEnabled={this.state.physicsEnabled}
            />
          </div>
        </div>

        <div className={styles.rightSidePanel}>
          <AnalysisButton togglePanel={() => this.toggleAnalysisPanel()} />
        </div>

        <SlidingPanel isOpen={this.state.isAnalysisOpen} position="right" width="10%">
          <AnalysisPanel
            setOverlay={this.setOverlay}
            toggleSearchOverlay={() => this.toggleSearchOverlay()}
            toggleOptionsOverlay={() => this.toggleOptionsOverlay()}
            toggleFilterPanel={() => this.toggleFilterPanel()}
            toggleTimeLinePanel={() => this.toggleTimeLinePanel()}
            togglePanel={() => this.toggleAnalysisPanel()}
            toggleUnconnectedNodesVisible={() => {
              this.toggleUnconnectedNodesVisible();
            }}
            toggleindirectConnectionsVisible={() => this.toggleindirectConnectionsVisible()}
            closeOverlay={() => this.closeOverlay()}
            investorsFiltered={this.state.investorsFiltered}
            engineersFiltered={this.state.engineersFiltered}
            filterEngineeringNodes={() => this.filterEngineeringNodes()}
            filterInvestorNodes={() => this.filterInvestorNodes()}
            physicsEnabled={this.state.physicsEnabled}
            togglePhysicsEnabled={this.togglePhysicsEnabled}
            indirectConnectionsVisible={this.state.indirectConnectionsVisible}
            unconnectedNodesVisible={this.state.unconnectedNodesVisible}
            resetFilters={() => this.resetFilters()}
          />
        </SlidingPanel>
        {searchOverlay}
        {overlay}
      </div>
    );
  }
}

export default SocialApp;
