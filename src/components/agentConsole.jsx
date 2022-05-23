import React from "react";
import Entries from "./entries";
import LoadingSpinner from "./loadingSpinner";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import UserConsole from "./userConsole";
import Divider from "./divider";

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
      email: "",
      transaction_ids: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        email: user.signInUserSession.idToken.payload["email"],
      });
      this.loadGameData();
    });
  }

  async loadGameData() {
    this.setState({ loading: true });
    let data = await getGameData(this.state.jwtKey, this.state.email);
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
          {this.state.email === "" ? <LoadingSpinner /> : <UserConsole />}
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

export default AgentConsole;
