import React from "react";
import PropTypes from "prop-types";

import styles from "./ShipTitle.module.css";

function ShipTitle(props) {
  if (props.name == null) {
    return null;
  } else {
    return (
      <button href="#" className={styles.button} style={props.style}>
        {props.name}
      </button>
    );
  }
}

ShipTitle.propTypes = {
  shipTitle: PropTypes.string.isRequired,
  style: PropTypes.string,
};

export default ShipTitle;
