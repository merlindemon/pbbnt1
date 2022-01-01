// src/components/Entries.js

import React, { Component } from "react";
import Entry from "./entry";

class Entries extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <center>
          <h1>Entries</h1>
        </center>
        <div>
          <div class="entries-body">
            <table border="1" class="entries">
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>ID</th>
                <th>Tips</th>
                <th>Hands</th>
                <th>Profit</th>
              </tr>
              {this.props.entries
                .sort((a, b) =>
                  a.Player.S.toUpperCase() > b.Player.S.toUpperCase() ? 1 : -1
                )
                .map((entry) => (
                  <Entry entry={entry} />
                ))}
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default Entries;
