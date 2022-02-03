// src/components/UserData.js

import React, { Component } from "react";
import bank from "../images/bank.png";
import hand from "../images/hands.png";
import identiferimage from "../images/identifiers.png";
import UserTransactions from "./usertransactions";

class UserData extends Component {
  constructor(props) {
    super(undefined);
    this.state = {
      profit: 0.0,
      hands: 0,
      ids: [],
      playernames: [],
    };
  }

  componentDidMount() {
    if (typeof this.props.entries !== undefined) {
      let profit = 0.0;
      let hands = 0;
      let playernames = [];
      this.props.entries.forEach((element) => {
        playernames.push(element.Player.S);
        profit += parseFloat(element.Profit.N);
        hands += parseInt(element.Hands.N);
      });
      this.setState({ playernames });
      this.setState({ ids: this.props.ids });
      this.setState({ profit });
      this.setState({ hands });
    }
  }

  render() {
    const { hands, profit, ids, playernames } = this.state;
    return (
      <div>
        <center>
          <h1>{playernames.join()}</h1>
        </center>
        <div>
          <table className="entries">
            <tr>
              <td>
                <table className="transactions">
                  <tr>
                    <td>
                      <img src={identiferimage} alt="Player IDs"/>
                    </td>
                    <td>
                      {ids.map((id) => (
                          <p>{id}</p>
                      ))}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <img src={hand} alt="Hands Played"/>
                    </td>
                    <td>{hands}</td>
                  </tr>
                  <tr>
                    <td>
                      <img src={bank} alt="Bank"/>
                    </td>
                    <td style={{ color: colorMoney(profit) }}>
                      {formatMoney(profit)}
                    </td>
                  </tr>
                </table>
              </td>
              <td>
                <UserTransactions ids={ids} />
              </td>
            </tr>
          </table>
        </div>
      </div>
    );
  }
}

function formatMoney(string) {
  if (string === "") {
    return "";
  }
  return parseFloat(string).toFixed(2);
}

function colorMoney(string) {
  string = parseFloat(string);
  if (string > 0) {
    return "#33cc33";
  }
  if (string < 0) {
    return "#ff1a1a";
  }
  return "#ffffff";
}

export default UserData;
