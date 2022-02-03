// src/components/Entry.js

import React from "react";
import awsconfig from "../aws-exports";
import Amplify, {API, Auth} from "aws-amplify";
import LoadingSpinner from "./loadingSpinner";
import UserTransactionsAdminView from "./usertransactionsadminview";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class Entry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rank: 0,
      playernames: [],
      email: "",
      hands: 0,
      ids: [],
      profit: 0.0,
      tips: 0.0,
      adjust: "",
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        rank: this.props.entry.Rank,
        hands: this.props.entry.Hands,
        email: this.props.entry.Email,
        playernames: this.props.entry.Player,
        ids: this.props.entry.ID,
        profit: this.props.entry.Profit,
        tips: this.props.entry.Tips,
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
    return this.state.loading ? <LoadingSpinner/> : <UserTransactionsAdminView ids={ids}/>;
  }

  displayAdjustButton() {
    return <button onClick={() => this.adjustProfit()}>Add/Subtract</button>;
  }

  render() {
    let { rank, playernames, ids, hands, profit, tips, adjust } = this.state;
    return (
      <tr>
        <td className="entry-rank" id={rank}>
          {rank}
        </td>
        <td className="entry-player">{playernames.join(" ")}
        </td>
        <td className="entry-id">
            <button className="ids-button" onClick={() => this.toggleTransactions()}>{ids.join(" ")}</button>
        </td>
        <td className="entry-tips" style={{ color: colorMoney(tips) }}>
          {formatMoney(tips)}
        </td>
        <td className="entry-hands">{hands}</td>
        <td className="entry-profit" style={{ color: colorMoney(profit) }}>
          {formatMoney(profit)}
        </td>
        <td>
          <input
            placeholder=""
            onChange={this.handleAdjust}
            value={adjust}
            className="input1"
            />
        </td>
        <td>
          {this.state.toggleTransactions
                        ? this.displayTransactions(ids)
                        : this.displayAdjustButton()}
        </td>
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
      ids: ids.join()
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
