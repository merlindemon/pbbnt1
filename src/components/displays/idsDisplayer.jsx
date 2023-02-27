import React, { Component } from "react";
import IdDisplayer from "./idDisplayer";

class IdsDisplayer extends Component {
  constructor(props) {
    super(undefined);
    this.state = {};
  }

  render() {
    let local_entries = this.props.entries;
    let sorted_entries = local_entries.sort((a, b) =>
      a.email.S.toUpperCase() > b.email.S.toUpperCase() ? 1 : -1
    );
    return (
      <div>
        <center>
          <h1>Entries</h1>
        </center>
        <div>
          <table border="1" className="entries">
            <th>Email</th>
            <th>IDs</th>
            <div>
              <th style={{ minWidth: "85px" }}>Manager?</th>
              <th style={{ minWidth: "85px" }}>Agent?</th>
            </div>
            {sorted_entries.map((entry) => (
              <IdDisplayer entry={entry} />
            ))}
          </table>
        </div>
      </div>
    );
  }
}

export default IdsDisplayer;
