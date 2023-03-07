// src/components/UserData.js

import React, { Component } from "react";
import bank from "../images/bank_image.png";
import hand from "../images/hands_image.png";
import identiferimage from "../images/thumbprint_image.png";
import UserTransactions from "./usertransactions";
import { Auth, Hub } from "aws-amplify";

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

  async onSignOutClick() {
    await Auth.signOut()
      .then((data) => console.log(data))
      .catch((err) => console.log(err));
    Hub.dispatch("UI Auth", {
      // channel must be 'UI Auth'
      event: "AuthStateChange", // event must be 'AuthStateChange'
      message: "signedout", // message must be 'signedout'
    });
  }

  render() {
    const { hands, profit, ids, playernames } = this.state;
    return (
      <div>
        <div>
          <h1 style={{ display: "inline-block", marginRight: "100px" }}>
            {playernames.join()}
          </h1>
          <button id="close-CSS" onClick={this.onSignOutClick}></button>
        </div>
        <div>
          <table className="entries">
            <tr>
              <td>
                <img src={identiferimage} alt="Player IDs" />
              </td>
              <td>
                {ids.map((id) => (
                  <p>{id}</p>
                ))}
              </td>
            </tr>
            <tr>
              <td>
                <img src={hand} alt="Hands Played" />
              </td>
              <td>{hands}</td>
            </tr>
            <tr>
              <td>
                <img src={bank} alt="Bank" />
              </td>
              <td
              // style={{ color: colorMoney(profit) }}
              >
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

// function colorMoney(string) {
//   string = parseFloat(string);
//   if (string > 0) {
//     return "#33cc33";
//   }
//   if (string < 0) {
//     return "#ff1a1a";
//   }
//   return "#ffffff";
// }

export default UserData;
