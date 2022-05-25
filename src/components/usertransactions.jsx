// src/components/UserData.js

import React, { Component } from "react";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import { Type } from "../enums/transaction_types";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class UserData extends Component {
  constructor(props) {
    super(undefined);
    this.state = {
      ids: [],
      transactions: [],
      deposit_transactions: [],
      withdrawal_transactions: [],
      game_transactions: [],
      type: Type.SENT,
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
        let deposit_transactions = filterTransactions(transactions, Type.SENT);
        let withdrawal_transactions = filterTransactions(
          transactions,
          Type.RECEIVED
        );
        let game_transactions = filterTransactions(transactions, Type.GAME);
        this.setState({
          transactions,
          deposit_transactions,
          withdrawal_transactions,
          game_transactions,
        });
      }
    }
  }

  toggleType(value) {
    this.setState({ type: value });
  }

  getTransactionsByType() {
    switch (this.state.type) {
      case Type.SENT:
        return this.state.deposit_transactions;
      case Type.RECEIVED:
        return this.state.withdrawal_transactions;
      case Type.GAME:
        return this.state.game_transactions;
      default:
        return this.state.game_transactions;
    }
  }

  render() {
    let transactions = this.getTransactionsByType();
    return (
      <div>
        <button onClick={() => this.toggleType(Type.SENT)}>Sent</button>
        <button onClick={() => this.toggleType(Type.RECEIVED)}>Received</button>
        <button onClick={() => this.toggleType(Type.GAME)}>Games</button>
        <table border="1" className="transactions">
          <th>Transaction Date</th>
          <th>Amount</th>
          {transactions
            .sort((a, b) => (a.Date.S < b.Date.S ? 1 : -1))
            .forEach((transaction) => (
              <tr>
                <td>{transaction.Date.S}</td>
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

function filterTransactions(transactions, type) {
  let deposit_transactions = [];
  transactions
    .sort((a, b) => (a.Date.S < b.Date.S ? 1 : -1))
    .map((transaction) => {
      if (transaction.Type.S === type) {
        deposit_transactions.push(transaction);
      }
    });
  return deposit_transactions;
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

async function getTransactions(jwtKey, ids) {
  let id_str = ids.join();
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
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
}

export default UserData;
