import React, { Component } from "react";
import Entries from "../entries";
import LoadingSpinner from "../helpers/loadingSpinner";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";

const ADMIN_API = "pbbntadmin";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class AgentDisplay extends Component {
  constructor(props) {
    super(undefined);
    this.state = {
      agent_email: "",
      player_emails: "",
      displayAgentData: false,
      loading: true,
      jwtKey: "",
      entries: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        agent_email: this.props.agent_email,
        player_emails: this.props.ids,
      });
    });
  }

  async loadGameData() {
    this.setState({ loading: true });
    let data = await getGameData(this.state.jwtKey, this.state.agent_email);
    this.setState({ entries: data, loading: false });
  }

  toggleGameData() {
    if (this.state.displayAgentData === true) {
      this.setState({ displayAgentData: false });
    }
    if (this.state.displayAgentData === false) {
      this.setState({ displayAgentData: true });
      this.loadGameData();
    }
  }

  displayGameData() {
    return this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <td>
        <Entries entries={this.state.entries} />
      </td>
    );
  }

  render() {
    return (
      <tr>
        <td>[{this.state.agent_email}]</td>
        {this.state.displayAgentData ? (
          this.displayGameData()
        ) : (
          <td className="ids-button">{this.state.player_emails}</td>
        )}
        <td>
          <button className="safebutton" onClick={() => this.toggleGameData()}>
            Display Game Data
          </button>
        </td>
      </tr>
    );
  }
}

async function getGameData(jwtKey, agent_email) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    ADMIN_API,
    "/pbbntadmin?Search=" + encodeURIComponent(agent_email),
    myInit
  )
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
}

export default AgentDisplay;
