import React from "react";
import LoadingSpinner from "../helpers/loadingSpinner";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import AgentDisplayer from "../displays/agentDisplayer";
import UserConsole from "./userConsole";
import Divider from "../helpers/divider";
import GameDataDisplayer from "../displays/gameDataDisplayer";

const AGENTS_API = "pbbntagents";

Amplify.configure(awsconfig);
Auth.configure(awsconfig);
API.configure(awsconfig);

class ManagerConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      loading: false,
      preferred_username: "",
      currentDisplay: <div></div>,
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        preferred_username:
          user.signInUserSession.idToken.payload["preferred_username"],
        jwtKey: user.signInUserSession.idToken.jwtToken,
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

  displayAgentDisplayer() {
    return this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <AgentDisplayer entries={this.state.entries} />
    );
  }

  displayGameData() {
    return this.state.loading ? <LoadingSpinner /> : <GameDataDisplayer />;
  }

  toggleDisplay(display) {
    if (display === "agentManager") {
      this.setState({ currentDisplay: this.displayAgentDisplayer() });
    }
    if (display === "gameData") {
      this.setState({ currentDisplay: this.displayGameData() });
    }
    return this.state.currentDisplay;
  }

  render() {
    return (
      <div className="center">
        <div>
          {this.state.preferred_username === "" ? (
            <LoadingSpinner />
          ) : (
            <UserConsole />
          )}
          <div className="black">
            <Divider />
            <h1>Manager Console</h1>
            <div>
              <button onClick={() => this.toggleDisplay("agentManager")}>
                Show Agents
              </button>
              <button onClick={() => this.toggleDisplay("gameData")}>
                Show Game Data
              </button>
            </div>
            <Divider />
            {this.state.loading ? (
              <LoadingSpinner />
            ) : (
              this.toggleDisplay(this.state.currentDisplay)
            )}
            <Divider />
          </div>
        </div>
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

export default ManagerConsole;
