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

  return (
    <div className={styles.container} onClick={props.close}>
      <div>
        <div>
            <BigBox><div className={styles.name}>{person.getName()}</div></BigBox>
        </div>
      </div>
      <div className={styles.content}>
        <div>
          <div className={styles.bio}>{bio}</div>
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
