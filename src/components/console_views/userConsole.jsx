import React from "react";
import UserData from "../userdata";
import LoadingSpinner from "../helpers/loadingSpinner";
import awsconfig from "../../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";

const USER_API = "pbbntuser";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class UserConsole extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      email: "",
      jwtKey: "",
      loading: true,
      firstLoad: true,
      ids: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        email: user.signInUserSession.idToken.payload["email"],
      });
      this.reloadEntries();
    });
  }

  async reloadEntries() {
    if (this.state.loading === false) {
      this.setState({ loading: true });
    }
    if (this.state.email !== "") {
      let ids = await getUserIds(this.state.jwtKey, this.state.email);
      let entries = [];
      if (ids !== undefined && ids.length > 0) {
        entries = await getUserData(this.state.jwtKey, ids);
      } else {
        ids = [];
      }
      this.setState({
        entries,
        loading: false,
        ids,
      });
    }
  }

  render() {
    return (
      <div>
        {this.state.loading ? (
          <LoadingSpinner />
        ) : (
          <UserData entries={this.state.entries} ids={this.state.ids} />
        )}
      </div>
    );
  }
}

async function getUserIds(jwtKey, email) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    USER_API,
    "/ids?Search=" + encodeURIComponent(email),
    myInit
  )
    .then((result) => {
      result = result.Items[0];
      let id_objects = result.ids.L;
      let ids = [];
      id_objects.forEach((element) => {
        ids.push(element.S);
      });
      return ids;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function getUserData(jwtKey, ids) {
  let id_str = ids.join();
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    USER_API,
    "/user?Search=" + encodeURIComponent(id_str),
    myInit
  )
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
}

export default UserConsole;
