// src/components/CreditLimit.js

import React from "react";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import LoadingSpinner from "./helpers/loadingSpinner";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class CreditLimit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      creditLimit: "",
      groups: [],
      loading: false,
      backgroundColor: "#FF0000",
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        groups: user.signInUserSession.idToken.payload["cognito:groups"],
        email: this.props.email,
      });
    });
    let creditLimit = await retrieveCreditLimit(
      this.state.jwtKey,
      this.state.email
    );
    if (creditLimit !== undefined) {
      this.setState({ creditLimit, backgroundColor: "#03942a" });
    }
  }

  handleCreditLimit = (event) => {
    this.setState({
      creditLimit: event.target.value,
      backgroundColor: "#FFFF00",
    });
  };

  async saveCreditLimits() {
    this.setState({ loading: true });
    await setCreditLimit(
      this.state.jwtKey,
      this.state.email,
      this.state.creditLimit
    );
    this.setState({ loading: false, backgroundColor: "#03942a" });
    return "";
  }

  render() {
    let { creditLimit, backgroundColor } = this.state;
    let creditLimitBox = <p>{creditLimit}</p>;
    let isAdmin = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
    }
    let saveBtn = this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <button onClick={() => this.saveCreditLimits()}>Save</button>
    );
    if (isAdmin) {
      let styles = {
        background: backgroundColor,
      };

      creditLimitBox = (
        <div>
          <div style={styles}>
            <textarea
              className="creditLimit_textarea"
              value={creditLimit}
              onChange={this.handleCreditLimit}
            ></textarea>
          </div>
          {saveBtn}
        </div>
      );
    }
    return <div>{creditLimitBox}</div>;
  }
}

async function retrieveCreditLimit(jwtKey, email) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    "pbbntids",
    "/creditLimit?Search=" + encodeURIComponent(email),
    myInit
  )
    .then((result) => {
      let creditLimit = "";
      result = result.Items[0];
      if (result !== undefined) {
        creditLimit = result.creditLimit.S;
      }
      return creditLimit;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function setCreditLimit(jwtKey, email, creditLimit) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      email: email,
      creditLimit: creditLimit,
    },
  };
  return await API.put("pbbntids", "/creditLimit", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
}

export default CreditLimit;