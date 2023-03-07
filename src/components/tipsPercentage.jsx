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
      rakeback: 0.0,
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
      tips: this.props.tips,
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
    this.calculateRakeback();
  }

  handleTipsPercentage = (event) => {
    if (validation(event.target.value)) {
      this.setState({
        tipsPercentage: event.target.value,
        dislaySaveBtn: true,
        backgroundColor: "#c7491f",
      });
    }
  };

  async saveTipsPercentages() {
    this.setState({ loading: true });
    await setTipsPercentage(
      this.state.jwtKey,
      this.state.email,
      this.state.tipsPercentage
    );
    this.calculateRakeback();
    this.setState({
      loading: false,
      dislaySaveBtn: false,
      backgroundColor: "#03942a",
    });
    return "";
  }

  async calculateRakeback() {
    let rakeback = (
      (parseFloat(this.state.tipsPercentage) / 100) *
      parseFloat(this.state.tips)
    ).toFixed(2);
    this.setState({
      rakeback: rakeback,
    });
  }

  render() {
    let { tipsPercentage } = this.state;
    let tipsPercentageBox = <p>{tipsPercentage}</p>;
    let isAdmin = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
    }
    let loading = this.state.loading ? <LoadingSpinner /> : <div />;
    let saveBtn = this.state.dislaySaveBtn ? (
      <button onClick={() => this.saveTipsPercentages()}>Save</button>
    ) : (
      <div />
    );
    let rakeback = this.state.rakeback;
    if (isAdmin) {
      let styles = {
        fontSize: "14px",
      };

      let stylesB = {
        color: "#FFFFFF",
        marginLeft: "20px",
        maxWidth: "85px",
        width: "100%",
        display: "block",
      };

      tipsPercentageBox = (
        <div>
          <div style={styles}>
            <input
              className="tipsPercentage_textarea"
              value={tipsPercentage}
              type="number"
              onChange={this.handleTipsPercentage}
              style={stylesB}
            ></input>
          </div>
          <div>
            <p>"{rakeback}"</p>
          </div>
          {saveBtn}
          {loading}
        </div>
      );
    }
    return <div>{tipsPercentageBox}</div>;
  }
}

function validation(tipsPercentage) {
  if (tipsPercentage === undefined) {
    return false;
  }
  return tipsPercentage >= 0 && tipsPercentage <= 100;
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
        tipsPercentage = result.tipsPercentage.N;
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
