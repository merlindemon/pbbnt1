import React, { Component } from "react";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import IdsDisplayer from "../displays/idsDisplayer";
import LoadingSpinner from "../helpers/loadingSpinner";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class IdManager extends Component {
  state = {
    loading: true,
    preferred_username: "",
    id: "",
    jwtToken: "",
    entries: [],
  };

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        preferred_username:
          user.signInUserSession.idToken.payload["preferred_username"],
      });
      this.reloadEntries();
    });
  }

  async reloadEntries() {
    if (this.state.loading === false) {
      this.setState({ loading: true });
    }
    let data = await getEntireUsernameTable(this.state.jwtKey);
    this.setState({ loading: false, entries: data });
  }

  async addButtonAction() {
    if (this.state.preferred_username !== "" && this.state.id !== "") {
      this.setState({ loading: true });
      await associateUsernameWithUserId(
        this.state.jwtKey,
        this.state.preferred_username,
        this.state.id
      );
      this.setState({ id: "", preferred_username: "" });
      await this.reloadEntries();
    }
  }

  async removeButtonAction() {
    if (this.state.preferred_username !== "" && this.state.id !== "") {
      this.setState({ loading: true });
      await deassociateUsernameWithUserId(
        this.state.jwtKey,
        this.state.preferred_username,
        this.state.id
      );
      this.setState({ id: "", preferred_username: "" });
      await this.reloadEntries();
    }
  }

  handleUsername = (event) => {
    this.setState({ preferred_username: event.target.value });
  };

  handleId = (event) => {
    this.setState({ id: event.target.value });
  };

  render() {
    return (
      <div className="center">
        <h4>User Ids</h4>
        <table className="entries">
          <tr>
            <td>
              <label>Username: </label>
              <input
                onChange={this.handleUsername}
                value={this.state.preferred_username}
                className="input2"
                size="40"
              />
            </td>
            <td>
              <label>ID: </label>
              <input
                placeholder="#12345"
                onChange={this.handleId}
                value={this.state.id}
                className="input3"
                size="7"
              />
            </td>
            <td />
          </tr>
          <tr>
            <td>
              <button
                className="safebutton"
                onClick={() => this.addButtonAction()}
              >
                Associate ID
              </button>
            </td>
            <td />
            <td>
              <button
                className="dangerousbutton"
                onClick={() => this.removeButtonAction()}
              >
                Remove ID
              </button>
            </td>
          </tr>
        </table>
        {this.state.loading && this.state.entries.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <IdsDisplayer entries={this.state.entries} />
        )}
      </div>
    );
  }
}

async function getEntireUsernameTable(jwtKey) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get("pbbntuser", "/ids", myInit)
    .then((result) => {
      return result.Items;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function associateUsernameWithUserId(jwtKey, preferred_username, id) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      preferred_username: preferred_username.toLowerCase().trim(),
      id: id.trim(),
    },
  };
  let response;
  response = await API.put("pbbntuser", "/ids", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

async function deassociateUsernameWithUserId(jwtKey, preferred_username, id) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      preferred_username: preferred_username.toLowerCase().trim(),
      id: id.trim(),
    },
  };
  let response;
  response = await API.del("pbbntuser", "/ids", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export default IdManager;
