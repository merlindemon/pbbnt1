// src/components/Comment.js

import React from "react";
import awsconfig from "../aws-exports";
import Amplify, { API, Auth } from "aws-amplify";
import LoadingSpinner from "./helpers/loadingSpinner";

Amplify.configure(awsconfig);
API.configure(awsconfig);
Auth.configure(awsconfig);

class Comment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      comment: "",
      groups: [],
      loading: false,
      backgroundColor: "#FF0000",
    };
  }

  async componentDidMount() {
    await Auth.currentAuthenticatedUser().then((user) => {
      this.setState({
        jwtKey: user.signInUserSession.idToken.jwtToken,
        groups: user.signInUserSession.idToken.payload["cognito:groups"],
        email: this.props.email,
      });
    });
    let comment = await retrieveComment(this.state.jwtKey, this.state.email);
    if (comment !== undefined) {
      this.setState({ comment, backgroundColor: "#03942a" });
    }
  }

  handleComment = (event) => {
    this.setState({ comment: event.target.value, backgroundColor: "#FFFF00" });
  };

  async saveComments() {
    this.setState({ loading: true });
    await setComment(this.state.jwtKey, this.state.email, this.state.comment);
    this.setState({ loading: false, backgroundColor: "#03942a" });
    return "";
  }

  render() {
    let { comment, backgroundColor } = this.state;
    let commentBox = <p>{comment}</p>;
    let isAdmin = false;
    if (typeof this.state.groups !== "undefined") {
      isAdmin = this.state.groups.includes("admin");
    }
    let saveBtn = this.state.loading ? (
      <LoadingSpinner />
    ) : (
      <button onClick={() => this.saveComments()}>Save</button>
    );
    if (isAdmin) {
      let styles = {
        background: backgroundColor,
      };

      commentBox = (
        <div>
          <div style={styles}>
            <textarea
              className="comment_textarea"
              value={comment}
              onChange={this.handleComment}
            ></textarea>
          </div>
          {saveBtn}
        </div>
      );
    }
    return <div>{commentBox}</div>;
  }
}

async function retrieveComment(jwtKey, email) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
  };
  return await API.get(
    "pbbntids",
    "/comment?Search=" + encodeURIComponent(email),
    myInit
  )
    .then((result) => {
      let comment = "";
      result = result.Items[0];
      if (result !== undefined) {
        comment = result.comment.S;
      }
      return comment;
    })
    .catch((err) => {
      console.log(err);
    });
}

async function setComment(jwtKey, email, comment) {
  const myInit = {
    headers: {
      Authorization: "Bearer " + jwtKey,
    },
    body: {
      email: email,
      comment: comment,
    },
  };
  return await API.put("pbbntids", "/comment", myInit)
    .then((result) => {
      return result.success;
    })
    .catch((err) => {
      console.log(err);
    });
}

export default Comment;
