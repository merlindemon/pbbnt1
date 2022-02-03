import "./css/App.css";
import { API, Auth } from "aws-amplify";
import awsconfig from "./aws-exports";
import { AuthState, onAuthUIStateChange } from "@aws-amplify/ui-components";
import React from "react";
import LoadingSpinner from "./components/loadingSpinner";
import AdminConsole from "./components/adminConsole";
import ManagerConsole from "./components/managerConsole";
import UserConsole from "./components/userConsole";
import Header from "./components/header";
import { v4 as uuid } from 'uuid';

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
      <AmplifyAuthenticator usernameAlias="email">
        <AmplifySignUp
          slot="sign-up"
          usernameAlias="username"
          formFields={[
            {
              type: "email",
              label: "Email login",
              placeholder: "email",
              inputProps: { required: true, autocomplete: "email" },
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
              inputProps: { required: false, }
            }
          ]}
        />
        <AmplifySignIn slot="sign-in" usernameAlias="email"/>
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
      email: "",
      ids: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        groups: user.signInUserSession.idToken.payload["cognito:groups"],
        email: user.signInUserSession.idToken.payload["email"],
      });
    });
  }

  render() {
    let isAdmin = false;
    let isManager = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
      isManager = this.state.groups.includes("manager");
    }
    let display;
    if (isAdmin) {
      display = (
        <AdminConsole email={this.state.email} jwtKey={this.state.jwtKey} />
      );
    } else if(isManager) {
      display = (
          <ManagerConsole email={this.state.email} jwtKey={this.state.jwtKey} />
      );
    }
    else {
      display =
        this.state.email === "" ? (
          <LoadingSpinner />
        ) : (
          <UserConsole jwtKey={this.state.jwtKey} email={this.state.email} />
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
