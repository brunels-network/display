import { style } from "d3";
import PropTypes from "prop-types";
import React from "react";

import "react-tabs/style/react-tabs.css";

import styles from "./ImageOverlay.module.css";

function ImageOverlay(props) {
  let filename = props.image;
  let credits = "Credits for the image";

  return (
    <div className={styles.container} onClick={props.close}>
      <img className={styles.image}
           src={require(`../${filename}`)} alt="A document" />
      <div className={styles.credits}>{credits}</div>
    </div>
  );
}

ImageOverlay.propTypes = {
  image: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
};

export default ImageOverlay;
