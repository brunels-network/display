import PropTypes from "prop-types";
import React from "react";

import "react-tabs/style/react-tabs.css";

import styles from "./BlankScreen.module.css";

function BlankScreen(props) {

  return (
    <div className={styles.container} onClick={props.close}>
      <div className={styles.content}>
      </div>
    </div>
  );
}

BlankScreen.propTypes = {
  close: PropTypes.func.isRequired,
};

export default BlankScreen;
