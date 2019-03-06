import React, { Component } from "react";
import styles from "./styles.module.css";

function ISS(props) {
  return (
    <div
      className={[
        styles.circleContainer,
        props.iss_passing ? styles.passing : ""
      ].join(" ")}
      style={{ animationDuration: `${props.oldDuration / 1000 + 1}s` }}
    >
      <div className={styles.foucs}>
        <div
          className={styles.circle}
          style={{
            animationDuration: `6s,${props.oldDuration / 1000 + 1}s`
          }}
        />
      </div>
    </div>
  );
}

export default ISS;
