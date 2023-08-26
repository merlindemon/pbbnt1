import React, { Component } from "react";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import LoadingSpinner from "../helpers/loadingSpinner";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class IdDisplayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      preferred_username: "",
      ids: [],
      manager: false,
      agent: false,
      loading: false,
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        preferred_username: this.props.entry.preferred_username.S,
        manager: this.props.entry.manager,
        agent: this.props.entry.agent,
      });
      if (this.props.entry.ids !== undefined) {
        this.setState({ ids: this.props.entry.ids.L });
      }
    });
  }

  async handleManagerChange(event, preferred_username) {
    this.setState({ loading: true });
    let newValue = !this.state.manager;
    this.setState({ manager: newValue });
    await editUserGroup(
      this.state.jwtKey,
      this.state.preferred_username,
      "manager",
      newValue
    );
    this.setState({ loading: false });
  }

  async handleAgentChange(event, preferred_username) {
    this.setState({ loading: true });
    let newValue = !this.state.agent;
    this.setState({ agent: newValue });
    await editUserGroup(
      this.state.jwtKey,
      this.state.preferred_username,
      "agent",
      newValue
    );
    this.setState({ loading: false });
  }

  render() {
    return (
      <tr>
        <td>[{this.state.preferred_username}]</td>
        <td>{joinIds(this.state.ids)}</td>
        {this.state.loading ? (
          <LoadingSpinner />
        ) : (
          <div>
            <td>
              <input
                type="checkbox"
                checked={this.state.manager}
                style={{ minWidth: "85px" }}
                onChange={(event) =>
                  this.handleManagerChange(event, this.state.preferred_username)
                }
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={this.state.agent}
                style={{ minWidth: "85px" }}
                onChange={(event) =>
                  this.handleAgentChange(event, this.state.preferred_username)
                }
              />
            </td>
          </div>
        )}
      </tr>
    );
  }
}

function joinIds(ids) {
  let array = [];
  if (ids !== undefined) {
    ids.forEach((id) => {
      array.push("[" + id.S + "]");
    });
  }

  return array.join();
}

async function editUserGroup(jwtKey, preferred_username, group, boolean) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      preferred_username: preferred_username.toLowerCase(),
      group: group,
      boolean: boolean,
    },
  };
  let response;
  response = await API.patch("pbbntuser", "/ids", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export default IdDisplayer;
