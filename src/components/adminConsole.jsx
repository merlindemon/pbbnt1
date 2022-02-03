import React from "react";
import Entries from "./entries";
import LoadingSpinner from "./loadingSpinner";
import awsconfig from "../aws-exports";
import Amplify, {API, Auth} from "aws-amplify";
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
      transaction_ids: []
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
    await this.loadGameData();
  }

  async resetTips() {
    this.setState({ loading: true });
    await resetAllTips(this.state.jwtKey);
    await this.loadGameData();
  }

  displayIdManager() {
    return this.state.loading ? <LoadingSpinner/> : <IdManager/>;
  }

  displayGameData() {
    return this.state.loading ? (
        <LoadingSpinner/>
    ) : (
        <div>
          <button className="safebutton" onClick={() => this.loadGameData()}>Refresh</button>
          <button className="dangerousbutton" onClick={() => this.resetHands()}>Reset Hands</button>
          <button className="dangerousbutton" onClick={() => this.resetTips()}>Reset Tips</button>
          <Entries entries={this.state.entries}/>
        </div>
    );
  }

  toggleDisplay() {
    this.setState({ toggleDisplay: !this.state.toggleDisplay });
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
  return await API.get("pbbntadmin", "/pbbntadmin", myInit)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
}

async function resetAllHands(jwtKey) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.del("pbbntadmin", "/hands", myInit)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
}

async function resetAllTips(jwtKey) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.del("pbbntadmin", "/tips", myInit)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
}

export default AdminConsole;
