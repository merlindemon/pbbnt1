// src/components/Entry.js

import React from "react";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import LoadingSpinner from "./helpers/loadingSpinner";
import UserTransactionsAdminView from "./usertransactionsadminview";
import Comment from "./comment";
import CreditLimit from "./creditLimit";
import TipsPercentage from "./tipsPercentage";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class Entry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rank: 0,
      playernames: [],
      preferred_username: "",
      hands: 0,
      ids: [],
      profit: 0.0,
      tips: 0.0,
      tipsPercentage: 0,
      creditLimit: 0,
      adjust: "",
      groups: [],
      toggleTransactions: false,
      loading: false,
      displayComment: false,
      updateCreditLimit: false,
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        groups: user.signInUserSession.idToken.payload["cognito:groups"],
        rank: this.props.entry.Rank,
        hands: this.props.entry.Hands,
        preferred_username: this.props.entry.Username,
        playernames: this.props.entry.Player,
        ids: this.props.entry.ID,
        profit: this.props.entry.Profit,
        tips: this.props.entry.Tips,
        creditLimit: this.props.entry.CreditLimit,
        tipsPercentage: this.props.entry.TipsPercentage,
      });
    });
  }

  async adjustProfit() {
    if (!isNaN(this.state.adjust)) {
      let adjust = formatMoney(this.state.adjust);
      await adjustProfitBalance(
        this.state.jwtKey,
        this.state.ids,
        this.state.adjust
      );
      let profit = this.state.profit;
      profit = parseFloat(profit) + parseFloat(adjust);
      this.setState({ profit });
    }
    this.setState({ adjust: "" });
  }

  handleAdjust = (event) => {
    this.setState({ adjust: event.target.value });
  };

  toggleTransactions() {
    this.setState({ toggleTransactions: !this.state.toggleTransactions });
  }

  displayTransactions(ids) {
    return this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <UserTransactionsAdminView ids={ids} />
    );
  }

  displayAdjustButton() {
    return <button onClick={() => this.adjustProfit()}>Add/Subtract</button>;
  }

  getComment(preferred_username) {
    return <Comment preferred_username={preferred_username} />;
  }

  toggleComment() {
    this.setState({ displayComment: !this.state.displayComment });
  }

  render() {
    let {
      rank,
      playernames,
      ids,
      hands,
      profit,
      tips,
      tipsPercentage,
      creditLimit,
      adjust,
      preferred_username,
    } = this.state;
    let isAdmin = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
    }
    let adjustButtondisplay = "";
    let inputdisplay = "";
    let commentDisplay = this.state.displayComment ? (
      this.getComment(preferred_username)
    ) : (
      <div />
    );
    if (isAdmin) {
      adjustButtondisplay = this.state.toggleTransactions
        ? this.displayTransactions(ids)
        : this.displayAdjustButton();
      inputdisplay = (
        <input
          placeholder=""
          onChange={this.handleAdjust}
          value={adjust}
          className="input1"
        />
      );
    }
    return (
      <tr>
        <td className="entry-rank" id={rank}>
          {rank}
        </td>
        <td className="entry-player">
          <button onClick={() => this.toggleComment()}>
            {playernames.join(" ")}
          </button>
          {commentDisplay}
        </td>
        <td className="entry-id">
          <button
            className="ids-button"
            onClick={() => this.toggleTransactions()}
          >
            {ids.join(" ")}
          </button>
        </td>
        <td
          className="entry-tips"
          style={{ color: colorMoney(tips), minWidth: "85px" }}
        >
          {formatMoney(tips)}
        </td>
        <td
          className="entry-tips-percentage"
          style={{ color: colorMoney(tipsPercentage), minWidth: "135px" }}
        >
          <TipsPercentage
            preferred_username={preferred_username}
            tipsPercentage={tipsPercentage}
            tips={formatMoney(tips)}
          />
        </td>
        <td
          className="entry-credit-limit"
          style={{ color: colorMoney(creditLimit), minWidth: "135px" }}
        >
          <CreditLimit
            preferred_username={preferred_username}
            creditLimit={creditLimit}
          />
        </td>
        <td className="entry-hands">{hands}</td>
        <td className="entry-profit" style={{ color: colorMoney(profit) }}>
          {formatMoney(profit)}
        </td>
        <td>{inputdisplay}</td>
        <td>{adjustButtondisplay}</td>
      </tr>
    );
  }
}

function formatMoney(string) {
  if (string === "") {
    return "";
  }
  if (isNaN(string)) {
    return "";
  } else {
    return parseFloat(string).toFixed(2);
  }
}

function colorMoney(string) {
  string = parseFloat(string);
  if (string > 0) {
    // return "#084f62";
    return "#33cc33";
  }
  if (string < 0) {
    return "#ff1a1a";
  }
  return "#ffffff";
}

async function adjustProfitBalance(jwtKey, ids, adjust) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      amount: adjust,
      ids: ids.join(),
    },
  };
  let response;
  response = await API.post("pbbntuser", "/transactions", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export default Entry;
