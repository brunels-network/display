import PropTypes from "prop-types";
import React from "react";

import styles from "./HowDoIOverlay.module.css";

import howDoIText from "../data/howDoIOverlayText.json";

class HowDoIOverlay extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <div className={styles.closeButton}>
          <button onClick={this.props.close} style={{ background: "none", border: "none", fontSize: "2.4vh" }}>
            x
          </button>
        </div>
        <div className={styles.textContainer}>
          <div className={styles.header}>How do I navigate Brunel&apos;s Network?</div>
          <div className={styles.intro}>
            <p>{howDoIText["intro"]}</p>
          </div>
          <div className={styles.body}>
            <p>{howDoIText["paraOne"]}</p>
            <br />
            <p>{howDoIText["paraTwo"]}</p>
            <br />
            <p>{howDoIText["paraThree"]}</p>
            <br />
            <p>{howDoIText["paraFour"]}</p>
          </div>
        </div>
      </div>
    );
  }
}

HowDoIOverlay.propTypes = {
  close: PropTypes.func.isRequired,
};

export default HowDoIOverlay;
