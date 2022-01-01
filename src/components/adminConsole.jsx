import React from "react";
import Entries from "./entries";
import LoadingSpinner from "./loadingSpinner";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import UserConsole from "./userConsole";
import IdManager from "./idManager";
import Divider from "./divider";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class AdminConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      jwtKey: "",
      loading: false,
      email: "",
      toggleDisplay: true,
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
    let data = await getGameData(this.state.jwtKey);
    this.setState({ entries: data, loading: false });
  }

  async resetHands() {
    this.setState({ loading: true });
    await resetAllHands(this.state.jwtKey);
    this.loadGameData();
  }

  displayIdManager() {
    let display = this.state.loading ? <LoadingSpinner /> : <IdManager />;
    return display;
  }

  displayGameData() {
    let display = this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <div>
        <button onClick={() => this.loadGameData()}>Refresh</button>
        <button onClick={() => this.resetHands()}>Reset Hands</button>
        <Entries entries={this.state.entries} />
      </div>
    );
    return display;
  }

  toggleDisplay() {
    this.setState({ toggleDisplay: this.state.toggleDisplay ? false : true });
  }

  render() {
    return (
      <div class="center">
        <div>
          {this.state.email === "" ? <LoadingSpinner /> : <UserConsole />}
          <div class="black">
            <Divider />
            <h1>Administrator Console</h1>
            <div>
              <button onClick={() => this.toggleDisplay()}>
                Toggle{" "}
                {this.state.toggleDisplay
                  ? "All Game Data"
                  : "User Email/ID Associations"}
              </button>
            </div>
            <Divider />
            {this.state.toggleDisplay
              ? this.displayIdManager()
              : this.displayGameData()}
            <Divider />
          </div>
        </div>
      </div>
    );
  }
}

async function getGameData(jwtKey) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  let response = await API.get("pbbntadmin", "/pbbntadmin", myInit)
    .then((result) => {
      return result.Items;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

async function resetAllHands(jwtKey) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  let response = await API.del("pbbntadmin", "/hands", myInit)
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export default AdminConsole;
