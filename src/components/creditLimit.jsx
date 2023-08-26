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
      update: false,
      groups: [],
      loading: false,
      dislaySaveBtn: false,
      backgroundColor: "#000000",
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        groups: user.signInUserSession.idToken.payload["cognito:groups"],
      });
    });
    this.setState({
      preferred_username: this.props.preferred_username,
      creditLimit: this.props.creditLimit,
    });
    let creditLimit;
    if (this.state.update) {
      creditLimit = await retrieveCreditLimit(
        this.state.jwtKey,
        this.state.preferred_username
      );
    }

    if (creditLimit !== undefined) {
      this.setState({ creditLimit, backgroundColor: "#03942a" });
    }
  }

  handleCreditLimit = (event) => {
    if (validation(event.target.value)) {
      this.setState({
        creditLimit: event.target.value,
        dislaySaveBtn: true,
        backgroundColor: "#c7491f",
      });
    }
  };

  async saveCreditLimits() {
    this.setState({ loading: true });
    await setCreditLimit(
      this.state.jwtKey,
      this.state.preferred_username,
      this.state.creditLimit
    );
    this.setState({
      loading: false,
      dislaySaveBtn: false,
      backgroundColor: "#03942a",
    });
    return "";
  }

  render() {
    let { creditLimit, backgroundColor } = this.state;
    let creditLimitBox = <p>{creditLimit}</p>;
    let isAdmin = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
    }
    let loading = this.state.loading ? <LoadingSpinner /> : <div />;
    let saveBtn = this.state.dislaySaveBtn ? (
      <button onClick={() => this.saveCreditLimits()}>Save</button>
    ) : (
      <div />
    );
    if (isAdmin) {
      let styles = {
        // background: backgroundColor,
        fontSize: "14px",
      };

      let stylesB = {
        color: "#FFFFFF",
        marginLeft: "20px",
        minWidth: "35px",
        maxWidth: "85px",
        width: "100%",
        display: "block",
      };

      creditLimitBox = (
        <div>
          <div style={styles}>
            <input
              className="creditLimit_textarea"
              value={creditLimit}
              type="number"
              onChange={this.handleCreditLimit}
              style={stylesB}
            ></input>
          </div>
          {saveBtn}
          {loading}
        </div>
      );
    }
    return <div>{creditLimitBox}</div>;
  }
}

function validation(creditLimit) {
  if (creditLimit === undefined) {
    return false;
  }
  return creditLimit >= 0 && creditLimit <= 1_000_000;
}

async function retrieveCreditLimit(jwtKey, preferred_username) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    "pbbntids",
    "/creditLimit?Search=" + encodeURIComponent(preferred_username),
    myInit
  )
    .then((result) => {
      let creditLimit = "";
      result = result.Items[0];
      if (result !== undefined) {
        creditLimit = result.creditLimit.N;
      }
      return creditLimit;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function setCreditLimit(jwtKey, preferred_username, creditLimit) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      preferred_username: preferred_username,
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
