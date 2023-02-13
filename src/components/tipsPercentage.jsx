// src/components/TipsPercentage.js

import React from "react";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import LoadingSpinner from "./helpers/loadingSpinner";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class TipsPercentage extends React.Component {
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
      email: this.props.email,
      tipsPercentage: this.props.tipsPercentage,
    });
    let tipsPercentage;
    if (this.state.update) {
      tipsPercentage = await retrieveTipsPercentage(
        this.state.jwtKey,
        this.state.email
      );
    }

    if (tipsPercentage !== undefined) {
      this.setState({ tipsPercentage, backgroundColor: "#03942a" });
    }
  }

  handleTipsPercentage = (event) => {
    this.setState({
      tipsPercentage: event.target.value,
      dislaySaveBtn: true,
      backgroundColor: "#c7491f",
    });
  };

  async saveTipsPercentages() {
    this.setState({ loading: true });
    await setTipsPercentage(
      this.state.jwtKey,
      this.state.email,
      this.state.tipsPercentage
    );
    this.setState({
      loading: false,
      dislaySaveBtn: false,
      backgroundColor: "#03942a",
    });
    return "";
  }

  render() {
    let { tipsPercentage, backgroundColor } = this.state;
    let tipsPercentageBox = <p>{tipsPercentage}</p>;
    let isAdmin = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
    }
    let saveBtn = this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <button onClick={() => this.saveTipsPercentages()}>Save</button>
    );
    if (isAdmin) {
      let styles = {
        background: backgroundColor,
        fontSize: "14px",
      };

      let stylesB = {
        color: "#FFFFFF",
        marginLeft: "20px",
        maxWidth: "35px",
        width: "100%",
        display: "block",
      };

      tipsPercentageBox = (
        <div>
          <div style={styles}>
            <input
              className="tipsPercentage_textarea"
              value={tipsPercentage}
              onChange={this.handleTipsPercentage}
              style={stylesB}
            ></input>
          </div>
          {saveBtn}
        </div>
      );
    }
    return <div>{tipsPercentageBox}</div>;
  }
}

async function retrieveTipsPercentage(jwtKey, email) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    "pbbntids",
    "/tipsPercentage?Search=" + encodeURIComponent(email),
    myInit
  )
    .then((result) => {
      let tipsPercentage = "";
      result = result.Items[0];
      if (result !== undefined) {
        tipsPercentage = result.tipsPercentage.S;
      }
      return tipsPercentage;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function setTipsPercentage(jwtKey, email, tipsPercentage) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      email: email,
      tipsPercentage: tipsPercentage,
    },
  };
  return await API.put("pbbntids", "/tipsPercentage", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
}

export default TipsPercentage;
