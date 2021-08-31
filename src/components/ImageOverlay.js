import PropTypes from "prop-types";
import React from "react";

import "react-tabs/style/react-tabs.css";

import styles from "./ImageOverlay.module.css";

function ImageOverlay(props) {
  let filename = props.image;

  return (
    <div className={styles.container} onClick={props.close}>
      <img className={styles.image}
           src={require(`../${filename}`)} alt="A document" />
    </div>
  );
}

ImageOverlay.propTypes = {
  image: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
};

export default ImageOverlay;
