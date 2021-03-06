import PropTypes from "prop-types";
import React from "react";

import Popover from "./Popover";
import ForceGraphD3 from "./d3/ForceGraph.d3.js";

import styles from "./ForceGraph.module.css";


class ForceGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      popup: null,
      show_logos: true,
    };

    this.updateSize = this.updateSize.bind(this);
    this.emitPopup = this.emitPopup.bind(this);
    this.clearPopup = this.clearPopup.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);

    this.containerRef = React.createRef();

    this.graph = new ForceGraphD3(this, props);
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateSize);
    this.updateSize();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateSize);
  }

  componentDidUpdate() {
    this.graph.emitPopup = this.emitPopup;
    this.graph.clearPopup = this.clearPopup;
    this.graph.draw();
  }

  updateSize() {
    const containerRect = this.containerRef.current.getBoundingClientRect();

    if (this.containerRef && this.graph) {
      let width = containerRect.width;
      let height = containerRect.height;

      let show_logos = (width >= 768);

      this.setState({show_logos: show_logos});

      this.graph.update({
        width: width,
        height: height
      });
      this.graph.drawFromScratch();
    }
  }

  emitPopup(node) {
    this.setState({ popup: node });
  }

  clearPopup() {
    this.setState({ popup: null });
  }

  render() {
    this.graph.update(this.props);

    let popup = null;

    if (this.state.popup) {
      let node = this.state.popup;

      popup = <Popover
        node={node}
        social={this.props.social}
        clearPopup={this.clearPopup}
        emitSetCenter={this.props.emitSetCenter}
        emitReadMore={this.props.emitReadMore}
      />;
    }

    let logos = null;

    if (this.state.show_logos){
      logos = (
        <div>
           <div className={styles.left_logo}>
            <img src={require("../images/uob_logo.png")}
                 alt="University of Bristol Logo"
                 className={styles.uob_logo_image}
            />
          </div>
          <div className={styles.qr_logo}>
            <img src={require("../images/network.png")}
                 alt="QR code for URL - fill in later"
                 className={styles.qr_logo_image}
            />
          </div>
          <div className={styles.right_logo}>
            <img src={require("../images/bi_logo.png")}
                 alt="Bristol Institute Logo"
                 className={styles.bi_logo_image}
            />
          </div>
        </div>
      );
    }

    return (
      <div ref={this.containerRef} className={styles.container}>
        {logos}
        <div className={this.graph.className()}>
          {popup}
        </div>
      </div>
    );
  }
}

ForceGraph.propTypes = {
  social: PropTypes.object.isRequired,
  emitSetCenter: PropTypes.func.isRequired,
  emitReadMore: PropTypes.func.isRequired,
};

export default ForceGraph;
