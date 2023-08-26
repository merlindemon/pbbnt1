import "./css/App.css";
import { API, Auth } from "aws-amplify";
import awsconfig from "./aws-exports";
import { AuthState, onAuthUIStateChange } from "@aws-amplify/ui-components";
import React from "react";
import LoadingSpinner from "./components/helpers/loadingSpinner";
import AdminConsole from "./components/console_views/adminConsole";
import ManagerConsole from "./components/console_views/managerConsole";
import AgentConsole from "./components/console_views/agentConsole";
import UserConsole from "./components/console_views/userConsole";
import Header from "./components/helpers/header";
import { v4 as uuid } from "uuid";

import {
  AmplifyAuthContainer,
  AmplifyAuthenticator,
  AmplifySignUp,
  AmplifySignIn,
} from "@aws-amplify/ui-react";

Auth.configure(awsconfig);
API.configure(awsconfig);

const AuthStateApp = () => {
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData);
    });
  }, []);

  return authState === AuthState.SignedIn && user ? (
    <div className="App">
      <div>
        <App />
      </div>
    </div>
  ) : (
    <AmplifyAuthContainer>
      <AmplifyAuthenticator usernameAlias="preferred_username">
        <AmplifySignUp
          slot="sign-up"
          usernameAlias="username"
          formFields={[
            {
              type: "preferred_username",
              label: "preferred_username login",
              placeholder: "preferred_username",
              inputProps: {
                required: true,
                autocomplete: "preferred_username",
              },
            },
            {
              type: "password",
              label: "Password",
              placeholder: "password",
              inputProps: { required: true, autocomplete: "new-password" },
            },
            {
              type: "preferred_username",
              label: "Do not Edit field",
              value: uuid(),
              readonly: true,
              inputProps: {
                required: true,
              },
            },
            {
              type: "username",
              label: "Do not Edit field",
              // placeholder: uuid(),
              value: uuid(),
              readonly: true,
              inputProps: { required: false },
            },
          ]}
        />
        <AmplifySignIn slot="sign-in" usernameAlias="preferred_username" />
      </AmplifyAuthenticator>
    </AmplifyAuthContainer>
  );
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jwtKey: "",
      groups: [],
      preferred_username: "",
      ids: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        groups: user.signInUserSession.idToken.payload["cognito:groups"],
        preferred_username:
          user.signInUserSession.idToken.payload["preferred_username"],
      });
    });
  }

  render() {
    let isAdmin = false;
    let isManager = false;
    let isAgent = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
      isManager = this.state.groups.includes("manager");
      isAgent = this.state.groups.includes("agent");
    }
    let display;
    if (isAdmin) {
      display = (
        <AdminConsole
          preferred_username={this.state.preferred_username}
          jwtKey={this.state.jwtKey}
        />
      );
    } else if (isManager) {
      display = (
        <ManagerConsole
          preferred_username={this.state.preferred_username}
          jwtKey={this.state.jwtKey}
        />
      );
    } else if (isAgent) {
      display = (
        <AgentConsole
          preferred_username={this.state.preferred_username}
          jwtKey={this.state.jwtKey}
        />
      );
    } else {
      display =
        this.state.preferred_username === "" ? (
          <LoadingSpinner />
        ) : (
          <UserConsole
            jwtKey={this.state.jwtKey}
            preferred_username={this.state.preferred_username}
          />
        );
    }
    return (
      <div>
        <div>
          <Header />
        </div>
        <div>{display}</div>
      </div>
    );
  }
}

export default AuthStateApp;
