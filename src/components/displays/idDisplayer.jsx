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
      email: "",
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
        email: this.props.entry.email.S,
        manager: this.props.entry.manager,
        agent: this.props.entry.agent,
      });
      if (this.props.entry.ids !== undefined) {
        this.setState({ ids: this.props.entry.ids.L });
      }
    });
  }

  async handleManagerChange(event, email) {
    this.setState({ loading: true });
    let newValue = !this.state.manager
    this.setState({ manager: newValue });
    await editUserGroup(
      this.state.jwtKey,
      this.state.email,
      "manager",
      newValue
    );
    this.setState({ loading: false });
  }

  async handleAgentChange(event, email) {
    this.setState({ loading: true });
    let newValue = !this.state.agent
    this.setState({ agent: newValue });
    await editUserGroup(
      this.state.jwtKey,
      this.state.email,
      "agent",
      newValue
    );
    this.setState({ loading: false });
  }

  render() {
    return (
      <tr>
        <td>[{this.state.email}]</td>
        <td>{joinIds(this.state.ids)}</td>
        {this.state.loading ? (
          <LoadingSpinner />
        ) : (
          <div>
            <td>
              <input
                type="checkbox"
                checked={this.state.manager}
                onChange={(event) =>
                  this.handleManagerChange(event, this.state.email)
                }
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={this.state.agent}
                onChange={(event) =>
                  this.handleAgentChange(event, this.state.email)
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

async function editUserGroup(jwtKey, email, group, boolean) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      "email": email.toLowerCase(),
      "group": group,
      "boolean": boolean,
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
