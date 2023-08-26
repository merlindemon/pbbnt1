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
    curr_user_preferred_username: "", //The preferred_username of the currently signed in user, who is an agent
    player_preferred_username: "", //The player's preferred_username address who is being managed
    jwtToken: "",
    entries: [],
  };

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        curr_user_preferred_username:
          user.signInUserSession.idToken.payload["preferred_username"],
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
    if (
      this.state.curr_user_preferred_username !== "" &&
      this.state.player_preferred_username !== ""
    ) {
      this.setState({ loading: true });
      await associateAgentUsernameWithPlayer(
        this.state.jwtKey,
        this.state.curr_user_preferred_username,
        this.state.player_preferred_username
      );
      this.setState({
        player_preferred_username: "",
        curr_user_preferred_username: "",
      });
      await this.reloadEntries();
    }
  }

  async removeButtonAction() {
    if (
      this.state.curr_user_preferred_username !== "" &&
      this.state.player_preferred_username !== ""
    ) {
      this.setState({ loading: true });
      await deassociateAgentUsernameWithPlayer(
        this.state.jwtKey,
        this.state.curr_user_preferred_username,
        this.state.player_preferred_username
      );
      this.setState({
        player_preferred_username: "",
        curr_user_preferred_username: "",
      });
      await this.reloadEntries();
    }
  }

  handleUsername = (event) => {
    this.setState({ curr_user_preferred_username: event.target.value });
  };

  handleId = (event) => {
    this.setState({ player_preferred_username: event.target.value });
  };

  render() {
    return (
      <div className="center">
        <h4>Agent-ID Associations</h4>
        <table className="entries">
          <tr>
            <td>
              <label>Agent Username: </label>
              <input
                onChange={this.handleUsername}
                value={this.state.curr_user_preferred_username}
                className="input2"
                size="40"
              />
            </td>
            <td>
              <label>Player Username: </label>
              <input
                placeholder="someone@preferred_username.com"
                onChange={this.handleId}
                value={this.state.player_preferred_username}
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
                Associate Player Username
              </button>
            </td>
            <td />
            <td>
              <button
                className="dangerousbutton"
                onClick={() => this.removeButtonAction()}
              >
                Remove Player Username
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

async function associateAgentUsernameWithPlayer(
  jwtKey,
  agent_preferred_username,
  player_preferred_username
) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      agent_preferred_username: agent_preferred_username.toLowerCase().trim(),
      player_preferred_username: player_preferred_username.toLowerCase().trim(),
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

async function deassociateAgentUsernameWithPlayer(
  jwtKey,
  agent_preferred_username,
  player_preferred_username
) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      agent_preferred_username: agent_preferred_username.toLowerCase().trim(),
      player_preferred_username: player_preferred_username.toLowerCase().trim(),
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
