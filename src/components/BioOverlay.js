import PropTypes from "prop-types";
import React from "react";

import "react-tabs/style/react-tabs.css";

import BigBox from "./BigBox";

import styles from "./BioOverlay.module.css";

function BioOverlay(props) {
  let social = props.social;

  const person = social.get(props.person);
  const id = person.getID();
  const name = person.getName();
  const biographies = props.social.getBiographies();

  // Get biography and strip name
  let bio = biographies.getByID(id);

  if (!bio) {
    bio = "No biography found.";
  }

  bio = bio.replace(name + ". ", "");

  let sources = [];
  let seen = {};

  Object.keys(person.getSources()).forEach((key) => {
    person.getSources()[key].forEach((item) => {
      if (!seen[item]) {
        let source = social.get(item);

        if (source) {
          sources.push(source);
        }

        seen[item] = 1;
      }
    });
  });

  let connections = social.getConnections().getConnectionsInvolving(person);

  connections.forEach((connection) => {
    Object.keys(connection.getAffiliationSources()).forEach((key) => {
      if (!seen[key]) {
        let source = social.get(key);

        if (source) {
          sources.push(source);
        }

        seen[key] = 1;
      }
    });

    Object.keys(connection.getCorrespondanceSources()).forEach((key) => {
      if (!seen[key]) {
        let source = social.get(key);

        if (source) {
          sources.push(source);
        }

        seen[key] = 1;
      }
    });
  })

  let source_parts = [];

  if (sources.length > 0) {
    sources.forEach((source) => {
      //console.log(source);
      source_parts.push(
        <li key={source.getID()}
          className={styles.source_item}>
          <span className={styles.source_name}>{source.getName(true)}</span>&nbsp;
          {source.getDescription()}
        </li>
      );
    })
  } else {
    source_parts.push(<li key="source"
                          className={styles.source_item}>No sources</li>);
  }

  let image = null;
  let credits = null;

  if (name.search("Isambard Kingdom Brunel") !== -1){
    image = <img src={require("../images/bios/BRUNEL.jpg")} className={styles.bio_image}
                 alt={`Image of ${name}`}/>;
    credits = "Isambard Kingdom Brunel - engraved by D. J. Pound [Brunel Institute BRSGB-2014.03578 from a photograph by Mayall, Accepted under the Cultural Gifts Scheme by HM Government from Clive Richards OBE DL  and allocated to the SS Great Britain Trust, 2017]";
  } else if (name.search("Thomas Guppy") !== -1){
    image = <img src={require("../images/bios/GUPPY.jpg")} className={styles.bio_image}
                 alt={`Image of ${name}`}/>;
    credits = "Thomas Guppy [Brunel Institute DM157 Short History of the SS Great Western/1938/Bristol Port Authority]";
  } else if (name.search("George H. Gibbs") !== -1){
    image = <img src={require("../images/bios/GIBBS.jpg")} className={styles.bio_image}
                 alt={`Image of ${name}`}/>;
    credits = "George Henry Gibbs, copy of Miniature in the Possession of Anthony Gibbs & Sons Ltd, reproduced in Jack Simmons, The Birth of the Great Western Railway Bath, 1971.";
  }

  if (image){
    credits = <div className={styles.bio_credits}>{credits}</div>;
  }

  return (
    <div className={styles.container} onClick={props.close}>
      <div>
        <div>
            <div className={styles.name}>{name}</div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.bio}>{bio}</div>
        <div className={styles.image}>
          {image}
          {credits}
        </div>
      </div>
    </div>
  );
}

BioOverlay.propTypes = {
  social: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired,
  person: PropTypes.string.isRequired,
};

export default BioOverlay;
