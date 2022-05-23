import React, { Component } from "react";

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
            <th>Agent Email</th>
            <th>Player Emails</th>
            {sorted_entries.map((entry) => (
              <tr>
                <td>{entry.agent_email.S}</td>
                <td>{joinIds(entry.ids)}</td>
              </tr>
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
      array.push(id.S);
    });
  }

  return array.join();
}

export default AgentDisplayer;
