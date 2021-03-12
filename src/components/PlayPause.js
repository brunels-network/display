import React, { useState, useEffect } from 'react';

import styles from "./PlayPause.module.css";

class PlayPause extends React.Component {
  constructor(props){
    super(props);
    this.state = {isActive: false,
                  signalPlay: props.signalPlay,
                  signalPause: props.signalPause};
  }

  toggle() {
    let isActive = !(this.state.isActive);

    if (isActive){
      if (this.state.signalPlay){
        this.state.signalPlay();
      }
    } else {
      if (this.state.signalPause){
        this.state.signalPause();
      }
    }

    this.setState({isActive: isActive});
  }

  render() {
    return (
      <div className={styles.box}>
        <button onClick={() => {this.toggle()}}>
          {this.state.isActive ? 'Pause' : 'Play'}
       </button>
      </div>
    );
  }
};

export default PlayPause;