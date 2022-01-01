// src/components/UserData.js

import React, { Component } from "react";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class UserData extends Component {
  constructor(props) {
    super();
    this.state = {
      ids: [],
      transactions: [],
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
      });
    });
    if (typeof this.props.ids !== undefined) {
      let ids = this.props.ids;
      this.setState({ ids });
      if (this.state.ids.length > 0) {
        let transactions = await getTransactions(
          this.state.jwtKey,
          this.state.ids
        );
        this.setState({ transactions });
      }
    }
  }

  render() {
    let { transactions } = this.state;
    if (transactions === undefined) {
      transactions = [];
    }
    return (
      <div>
        <table border="1" class="entries">
          <th>Transaction Date</th>
          <th>Type</th>
          <th>Amount</th>
          {transactions
            .sort((a, b) => (a.Date.S < b.Date.S ? 1 : -1))
            .map((transaction) => (
              <tr>
                <td>{transaction.Date.S}</td>
                <td>{transaction.Type.S}</td>
                <td style={{ color: colorMoney(transaction.Amount.N) }}>
                  {formatMoney(transaction.Amount.N)}
                </td>
              </tr>
            ))}
        </table>
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

async function getTransactions(jwtKey, ids) {
  let id_str = ids.join();
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  let response = await API.get(
    "pbbntuser",
    "/transactions?Search=" + encodeURIComponent(id_str),
    myInit
  )
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export default UserData;
