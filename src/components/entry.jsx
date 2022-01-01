// src/components/Entry.js

import React, { Component } from "react";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class Entry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rank: 0,
      player: "",
      hands: 0,
      id: "",
      profit: 0.0,
      tips: 0.0,
      adjust: "",
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        rank: this.props.entry.Rank.N,
        hands: this.props.entry.Hands.N,
        player: this.props.entry.Player.S,
        id: this.props.entry.ID.S,
        profit: this.props.entry.Profit.N,
        tips: this.props.entry.Tips.N,
      });
    });
  }

  async adjustProfit() {
    if (!isNaN(this.state.adjust)) {
      let adjust = formatMoney(this.state.adjust);
      await adjustProfitBalance(
        this.state.jwtKey,
        this.state.id,
        this.state.player,
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

  render() {
    let { rank, player, id, hands, profit, tips, adjust } = this.state;
    return (
      <tr>
        <td class="entry-rank" id={rank}>
          {rank}
        </td>
        <td class="entry-player">{player}</td>
        <td class="entry-id">{id}</td>
        <td class="entry-tips" style={{ color: colorMoney(tips) }}>
          {formatMoney(tips)}
        </td>
        <td class="entry-hands">{hands}</td>
        <td class="entry-profit" style={{ color: colorMoney(profit) }}>
          {formatMoney(profit)}
        </td>
        <td>
          <input
            placeholder=""
            onChange={this.handleAdjust}
            value={adjust}
          ></input>
        </td>
        <td>
          <button onClick={() => this.adjustProfit()}>Add/Subtract</button>
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
    return "#216C2A";
  }
  if (string < 0) {
    return "#c05f5f";
  }
  return "black";
}

async function adjustProfitBalance(jwtKey, id, playername, adjust) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      amount: adjust,
      id: id,
      playername: playername,
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
