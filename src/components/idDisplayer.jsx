import React, { Component } from "react";

class UserID extends Component {
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
            {sorted_entries.map((entry) => (
              <tr>
                <td>{entry.email.S}</td>
                <td>{joinIds(entry.ids.L)}</td>
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
  ids.forEach((id) => {
    array.push(id.S);
  });
  return array.join();
}

export default UserID;
