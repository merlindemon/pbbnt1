// src/components/Entries.js

import React, { Component } from "react";
import Entry from "./entry";

class Entries extends Component {
  render() {
    if (this.props.entries) {
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
                  <th>Credit Limit</th>
                  <th>Hands</th>
                  <th>Profit</th>
                  <th />
                </tr>
                {this.props.entries
                  .sort((a, b) =>
                    a.Player.join().toUpperCase() >
                    b.Player.join().toUpperCase()
                      ? 1
                      : -1
                  )
                  .map((entry) => (
                    <Entry entry={entry} />
                  ))}
                <tr>
                  <td>Totals</td>
                  <td></td>
                  <td></td>
                  <td>{getTotals(this.props.entries, "Tips")}</td>
                  <td></td>
                  <td>{getTotals(this.props.entries, "Profit")}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      );
    } else {
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
                  <th />
                </tr>
              </table>
            </div>
          </div>
        </div>
      );
    }
  }
}

function getTotals(entries, field) {
  let sum = 0;
  entries.forEach((entry) => {
    sum += entry[field];
  });
  return parseFloat(sum).toFixed(2);
}

export default Entries;
