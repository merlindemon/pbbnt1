import React from "react";
import Entries from "../entries";
import LoadingSpinner from "../helpers/loadingSpinner";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import UserConsole from "./userConsole";
import Divider from "../helpers/divider";

const ADMIN_API = "pbbntadmin";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class AgentConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      jwtKey: "",
      loading: false,
      preferred_username: "",
      transaction_ids: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        preferred_username:
          user.signInUserSession.idToken.payload["preferred_username"],
      });
      this.loadGameData();
    });
  }

  async loadGameData() {
    this.setState({ loading: true });
    let data = await getGameData(
      this.state.jwtKey,
      this.state.preferred_username
    );
    this.setState({ entries: data, loading: false });
  }

  displayGameData() {
    return this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <div>
        <button className="safebutton" onClick={() => this.loadGameData()}>
          Refresh
        </button>
        <Entries entries={this.state.entries} />
      </div>
    );
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
            <h1>Agent Console</h1>
            <Divider />
            {this.displayGameData()}
            <Divider />
          </div>
        </div>
      </div>
    );
  }
}

async function getGameData(jwtKey, agent_preferred_username) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    ADMIN_API,
    "/pbbntadmin?Search=" + encodeURIComponent(agent_preferred_username),
    myInit
  )
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
}

export default AgentConsole;
