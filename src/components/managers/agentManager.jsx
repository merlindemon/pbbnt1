import React, { Component } from "react";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import AgentDisplayer from "../displays/agentDisplayer";
import LoadingSpinner from "../helpers/loadingSpinner";

const AGENTS_API = "pbbntagents";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class AgentManager extends Component {
  state = {
    loading: true,
    curr_user_email: "", //The email of the currently signed in user, who is an agent
    player_email: "", //The player's email address who is being managed
    jwtToken: "",
    entries: [],
  };

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        curr_user_email: user.signInUserSession.idToken.payload["email"],
      });
      this.reloadEntries();
    });
  }

  async reloadEntries() {
    if (this.state.loading === false) {
      this.setState({ loading: true });
    }
    let data = await getEntireAgentsTable(this.state.jwtKey);
    this.setState({ loading: false, entries: data });
  }

  async addButtonAction() {
    if (this.state.curr_user_email !== "" && this.state.player_email !== "") {
      this.setState({ loading: true });
      await associateAgentEmailWithPlayer(
        this.state.jwtKey,
        this.state.curr_user_email,
        this.state.player_email
      );
      this.setState({ player_email: "", curr_user_email: "" });
      await this.reloadEntries();
    }
  }

  async removeButtonAction() {
    if (this.state.curr_user_email !== "" && this.state.player_email !== "") {
      this.setState({ loading: true });
      await deassociateAgentEmailWithPlayer(
        this.state.jwtKey,
        this.state.curr_user_email,
        this.state.player_email
      );
      this.setState({ player_email: "", curr_user_email: "" });
      await this.reloadEntries();
    }
  }

  handleEmail = (event) => {
    this.setState({ curr_user_email: event.target.value });
  };

  handleId = (event) => {
    this.setState({ player_email: event.target.value });
  };

  render() {
    return (
      <div className="center">
        <h4>Agent-ID Associations</h4>
        <table className="entries">
          <tr>
            <td>
              <label>Agent Email: </label>
              <input
                onChange={this.handleEmail}
                value={this.state.curr_user_email}
                className="input2"
                size="40"
              />
            </td>
            <td>
              <label>Player Email: </label>
              <input
                placeholder="someone@email.com"
                onChange={this.handleId}
                value={this.state.player_email}
                className="input3"
                size="40"
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
                Associate Player Email
              </button>
            </td>
            <td />
            <td>
              <button
                className="dangerousbutton"
                onClick={() => this.removeButtonAction()}
              >
                Remove Player Email
              </button>
            </td>
          </tr>
        </table>
        {this.state.loading && this.state.entries.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <AgentDisplayer entries={this.state.entries} />
        )}
      </div>
    );
  }
}

async function getEntireAgentsTable(jwtKey) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(AGENTS_API, "/agent", myInit)
    .then((result) => {
      return result.Items;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function associateAgentEmailWithPlayer(
  jwtKey,
  agent_email,
  player_email
) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      agent_email: agent_email.toLowerCase().trim(),
      player_email: player_email.toLowerCase().trim(),
    },
  };
  let response;
  response = await API.put(AGENTS_API, "/agent", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

async function deassociateAgentEmailWithPlayer(
  jwtKey,
  agent_email,
  player_email
) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      agent_email: agent_email.toLowerCase().trim(),
      player_email: player_email.toLowerCase().trim(),
    },
  };
  let response;
  response = await API.del(AGENTS_API, "/agent", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export default AgentManager;
