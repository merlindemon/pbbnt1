import React, { Component } from "react";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import IdDisplayer from "../displays/idDisplayer";
import LoadingSpinner from "../helpers/loadingSpinner";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class IdManager extends Component {
  state = {
    loading: true,
    email: "",
    id: "",
    jwtToken: "",
    entries: [],
  };

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        email: user.signInUserSession.idToken.payload["email"],
      });
      this.reloadEntries();
    });
  }

  async reloadEntries() {
    if (this.state.loading === false) {
      this.setState({ loading: true });
    }
    let data = await getEntireEmailTable(this.state.jwtKey);
    this.setState({ loading: false, entries: data });
  }

  async addButtonAction() {
    if (this.state.email !== "" && this.state.id !== "") {
      this.setState({ loading: true });
      await associateEmailWithUserId(
        this.state.jwtKey,
        this.state.email,
        this.state.id
      );
      this.setState({ id: "", email: "" });
      await this.reloadEntries();
    }
  }

  async removeButtonAction() {
    if (this.state.email !== "" && this.state.id !== "") {
      this.setState({ loading: true });
      await deassociateEmailWithUserId(
        this.state.jwtKey,
        this.state.email,
        this.state.id
      );
      this.setState({ id: "", email: "" });
      await this.reloadEntries();
    }
  }

  handleEmail = (event) => {
    this.setState({ email: event.target.value });
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
              <label>Email: </label>
              <input
                onChange={this.handleEmail}
                value={this.state.email}
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
          <IdDisplayer entries={this.state.entries} />
        )}
      </div>
    );
  }
}

async function getEntireEmailTable(jwtKey) {
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

async function associateEmailWithUserId(jwtKey, email, id) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      email: email.toLowerCase(),
      id: id,
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

async function deassociateEmailWithUserId(jwtKey, email, id) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      email: email.toLowerCase(),
      id: id,
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
