import { style } from "d3";
import PropTypes from "prop-types";
import React from "react";

import "react-tabs/style/react-tabs.css";

import styles from "./ImageOverlay.module.css";

function ImageOverlay(props) {
  let filename = props.image;

  if (!filename){
    return null;
  }

  let credits = null;

  if (filename.search("ES0.jpg") !== -1) {
    credits = "JohnCraig.co.uk";
  } else if (filename.search("ES1.jpg") !== -1) {
    credits = "Conveyance of the Corporation land at Temple Meads to the Great Western Company, Bristol Record Office, 00975 (11).";
  } else if (filename.search("ES2.jpg") !== -1){
    credits = "Great Western Railway Bristol Station [1840s] Drawing No.8 - Longitudinal Section through the Station Courtesy of Network Rail Corporate Archive, [NRCA17007]";
  } else if (filename.search("ES3.jpg") !== -1){
    credits = "Great Western Railway Bristol Station [1840s] Drawing No.12 - Cornice, Corbel, Courtesy of Network Rail Corporate Archive, [NRCA1100610]";
  } else if (filename.search("ES4.jpg") !== -1){
    credits = "Great Western Railway Bristol Station (1840s) Contract for Station - Courtesy of Network Rail Corporate Archive, [NRCA170013]";
  } else if (filename.search("ES5.jpg") !== -1){
    credits = "South Eastern View of the Great Western Railway Terminus, 1842, Bristol Reference Library, reproduced in John Binding Brunel's Bristol Temple Meads Oxford, 2001.";
  } else if (filename.search("ES6.jpg") !== -1){
    credits = "Photograph by SS Great Britain Trust";
  }

  console.log(`../${filename}`);

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
