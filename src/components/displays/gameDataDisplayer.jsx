import React from "react";
import Entries from "../entries";
import LoadingSpinner from "../helpers/loadingSpinner";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
const ADMIN_API = "pbbntadmin";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class GameDataDisplayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      jwtKey: "",
      loading: false,
      transaction_ids: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
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
    if (window.confirm("Are you sure you wish to reset the Hands?")) {
      this.setState({ loading: true });
      await resetAllHands(this.state.jwtKey);
      await this.loadGameData();
    }
  }

  async tipPlayers() {
    if (window.confirm("Are you sure you wish to tip the Players?")) {
      this.setState({ loading: true });
      await tipAllPlayers(this.state.jwtKey);
      await this.loadGameData();
    }
  }

  async resetTips() {
    if (window.confirm("Are you sure you wish to reset all of the Tips?")) {
      this.setState({ loading: true });
      await resetAllTips(this.state.jwtKey);
      await this.loadGameData();
    }
  }

  async refresh() {
    this.setState({ loading: true });
    await this.loadGameData();
  }

  render() {
    return this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <div>
        <Entries entries={this.state.entries} />
        <button className="safebutton" onClick={() => this.refresh()}>
          Refresh
        </button>
        <button className="dangerousbutton" onClick={() => this.resetHands()}>
          Reset Hands
        </button>
        <button className="warningButton" onClick={() => this.tipPlayers()}>
          Tip Players
        </button>
        <button className="dangerousbutton" onClick={() => this.resetTips()}>
          Reset Tips
        </button>
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
  return await API.get(ADMIN_API, "/pbbntadmin", myInit)
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
  return await API.del(ADMIN_API, "/hands", myInit)
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function tipAllPlayers(jwtKey) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.post(ADMIN_API, "/tipPlayers", myInit)
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
  return await API.del(ADMIN_API, "/tips", myInit)
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
}

export default GameDataDisplayer;
