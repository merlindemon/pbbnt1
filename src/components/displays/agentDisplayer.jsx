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
      a.agent_email.S.toUpperCase() > b.agent_email.S.toUpperCase() ? 1 : -1
    );
    return (
      <div>
        <center>
          <h1>Entries</h1>
        </center>
        <div>
          <table border="1" className="entries">
            <div>
              <th width="24%">Agent Email</th>
              <th width="66%">Player Emails</th>
              <th width="10%"></th>
            </div>
            {sorted_entries.map((entry) => (
              <AgentDisplay
                agent_email={entry.agent_email.S}
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
