import "./css/App.css";
import Amplify, { API, Auth } from "aws-amplify";
import awsconfig from "./aws-exports";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { AuthState, onAuthUIStateChange } from "@aws-amplify/ui-components";
import React from "react";
import LoadingSpinner from "./components/loadingSpinner";
import AdminConsole from "./components/adminConsole";
import UserConsole from "./components/userConsole";
import Header from "./components/header";
import {
  AmplifyAuthContainer,
  AmplifyAuthenticator,
  AmplifySignUp,
  AmplifySignIn,
} from "@aws-amplify/ui-react";

// Amplify.configure(awsconfig);
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
              type: "username",
              label: "Username",
              placeholder: "Username",
              inputProps: { required: true, autocomplete: "username" },
            },
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
              label: "Playername",
              placeholder: "Custom Playername",
              inputProps: {
                required: true,
                autocomplete: "preferred_username",
              },
            },
          ]}
        />
        <AmplifySignIn slot="sign-in" usernameAlias="email" />
      </AmplifyAuthenticator>{" "}
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
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
    }
    let display;
    if (isAdmin) {
      display = (
        <AdminConsole email={this.state.email} jwtKey={this.state.jwtKey} />
      );
    } else {
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
