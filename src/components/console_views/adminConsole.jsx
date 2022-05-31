import React from "react";
import LoadingSpinner from "../helpers/loadingSpinner";
import awsconfig from "../../aws-exports";
import Amplify, { Auth } from "aws-amplify";
import UserConsole from "./userConsole";
import IdManager from "../managers/idManager";
import AgentManager from "../managers/agentManager";
import GameDataDisplayer from "../displays/gameDataDisplayer";
import Divider from "../helpers/divider";

Amplify.configure(awsconfig);
Auth.configure(awsconfig);

class AdminConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      email: "",
      currentDisplay: <div></div>,
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        email: user.signInUserSession.idToken.payload["email"],
      });
    });
  }

  displayIdManager() {
    return this.state.loading ? <LoadingSpinner /> : <IdManager />;
  }

  displayAgentManager() {
    return this.state.loading ? <LoadingSpinner /> : <AgentManager />;
  }

  displayGameData() {
    return this.state.loading ? <LoadingSpinner /> : <GameDataDisplayer />;
  }

  toggleDisplay(display) {
    if (display === "idManager") {
      this.setState({ currentDisplay: this.displayIdManager() });
    }
    if (display === "agentManager") {
      this.setState({ currentDisplay: this.displayAgentManager() });
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
          {this.state.email === "" ? <LoadingSpinner /> : <UserConsole />}
          <div className="black">
            <Divider />
            <h1>Administrator Console</h1>
            <div>
              <button onClick={() => this.toggleDisplay("idManager")}>
                Manage Player IDs
              </button>
              <button onClick={() => this.toggleDisplay("agentManager")}>
                Manage Agents
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

export default AdminConsole;
