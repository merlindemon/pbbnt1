// src/components/Entries.js

import React, { Component } from "react";
import Entry from "./entry";

class Entries extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.entries){
      return (
          <div>
            <center>
              <h1>Entries</h1>
            </center>
            <div>
              <div className="entries-body">
                <table border="1" className="entries">
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>ID</th>
                    <th>Tips</th>
                    <th>Hands</th>
                    <th>Profit</th>
                    <th/>
                  </tr>
                  {this.props.entries.sort((a, b) =>
                        a.Player.join().toUpperCase() > b.Player.join().toUpperCase() ? 1 : -1
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
    else{
      return (
          <div>
            <center>
              <h1>Entries</h1>
            </center>
            <div>
              <div className="entries-body">
                <table border="1" className="entries">
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>ID</th>
                    <th>Tips</th>
                    <th>Hands</th>
                    <th>Profit</th>
                    <th/>
                  </tr>
                </table>
              </div>
            </div>
          </div>
      );
    }
  }
}

export default Entries;
