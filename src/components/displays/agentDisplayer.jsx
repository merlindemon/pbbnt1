import React, { Component } from "react";
import AgentDisplay from "./agentDisplay";

class AgentDisplayer extends Component {
  constructor(props) {
    super(undefined);
    this.state = {};
  }

  render() {
    let local_entries = this.props.entries;
    let sorted_entries = local_entries.sort((a, b) =>
      a.agent_preferred_username.S.toUpperCase() >
      b.agent_preferred_username.S.toUpperCase()
        ? 1
        : -1
    );
    return (
      <div>
        <center>
          <h1>Entries</h1>
        </center>
        <div>
          <table border="1" className="agentsTable">
            <th>Agent Username</th>
            <th>Player Username</th>
            <th></th>
            {sorted_entries.map((entry) => (
              <AgentDisplay
                agent_preferred_username={entry.agent_preferred_username.S}
                ids={joinIds(entry.ids)}
              />
            ))}
          </table>
        </div>
      </div>
    );
  }
}

function joinIds(ids) {
  let array = [];
  if (ids !== undefined) {
    ids = ids.L;
    ids.forEach((id) => {
      array.push("[" + id.S + "]");
    });
  }

  return array.join("\n");
}

export default AgentDisplayer;
