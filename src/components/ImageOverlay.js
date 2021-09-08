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

  if (filename.search("BRUNEL.jpg") != -1){
    credits = "Isambard Kingdom Brunel - engraved by D. J. Pound [Brunel Institute BRSGB-2014.03578 from a photograph by Mayall, Accepted under the Cultural Gifts Scheme by HM Government from Clive Richards OBE DL  and allocated to the SS Great Britain Trust, 2017]";
  } else if (filename.search("GUPPY.jpg") != -1){
    credits = "Thomas Guppy [Brunel Institute DM157 Short History of the SS Great Western/1938/Bristol Port Authority]";
  } else if (filename.search("GIBBS.jpg") != -1){
    credits = "George Henry Gibbs, copy of Miniature in the Possession of Anthony Gibbs & Sons Ltd, reproduced in Jack Simmons, The Birth of the Great Western Railway Bath, 1971.";
  } else if (filename.search("ES1.jpg") != -1) {
    credits = "Conveyance of the Corporation land at Temple Meads to the Great Western Company, Bristol Record Office, 00975 (11).";
  } else if (filename.search("ES2.jpg") != -1){
    credits = "Great Western Railway Bristol Station [1840s] Drawing No.8 - Longitudinal Section through the Station Courtesy of Network Rail Corporate Archive, [NRCA17007]";
  } else if (filename.search("ES3.jpg") != -1){
    credits = "Great Western Railway Bristol Station [1840s] Drawing No.12 - Cornice, Corbel, Courtesy of Network Rail Corporate Archive, [NRCA1100610]";
  } else if (filename.search("ES4.jpg") != -1){
    credits = "Great Western Railway Bristol Station (1840s) Contract for Station - Courtesy of Network Rail Corporate Archive, [NRCA170013]";
  } else if (filename.search("ES5.jpg") != -1){
    credits = "South Eastern View of the Great Western Railway Terminus, 1842, Bristol Reference Library, reproduced in John Binding Brunel's Bristol Temple Meads Oxford, 2001.";
  } else if (filename.search("ES6.jpg") != -1){
    credits = "Photograph by SS Great Britain Trust";
  }

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
