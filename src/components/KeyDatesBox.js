
import { style } from "d3-selection";
import PropTypes from "prop-types";
import React from "react";

import HBox from "./HBox";
import VBox from "./VBox";

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import styles from "./KeyDatesBox.module.css";


class KeyDatesBox extends React.Component {

  render() {

    let social = this.props.social;

    let dates = social.getKeyDates().getSortedDates();

    let date = dates[this.props.index];

    let max_val = dates.length;

    return (
      <div className={styles.box}>
        <VBox>
          <div className={styles.sliderbox}>
            <Slider min={0} max={max_val-1}
                    onChange={(val)=>{this.props.signalSetDateIndex(val)}}/>
          </div>
            <div>
              {date.getDescription()}
            </div>
        </VBox>
      </div>
    );
  }
}

KeyDatesBox.propTypes = {
};

export default KeyDatesBox;
