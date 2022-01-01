// src/components/UserData.js

import React, { Component } from "react";
import bank from "../images/bank.png";
import hand from "../images/hands.png";
import identiferimage from "../images/identifiers.png";
import UserTransactions from "./usertransactions";

class UserData extends Component {
  constructor(props) {
    super();
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
          <table border="1" class="entries">
            <tr>
              <td>
                IDs<br></br>
                <img src={identiferimage} alt="Player IDs"></img>
              </td>
              <td>
                {ids.map((id) => (
                  <p>{id}</p>
                ))}
              </td>
            </tr>
            <tr>
              <td>
                Hands<br></br>
                <img src={hand} alt="Hands Played"></img>
              </td>
              <td>{hands}</td>
            </tr>
            <tr>
              <td>
                Bank<br></br>
                <img src={bank} alt="Bank"></img>
              </td>
              <td style={{ color: colorMoney(profit) }}>
                {formatMoney(profit)}
              </td>
            </tr>
          </table>
          <UserTransactions ids={ids} />
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
    return "green";
  }
  if (string < 0) {
    return "red";
  }
  return "white";
}

export default UserData;
