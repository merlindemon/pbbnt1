import React, { Component } from "react";
import { AmplifySignOut } from "@aws-amplify/ui-react";
import Divider from "./divider";
// import background from "../../pubic/pokerrrr2logo.webp";

class Header extends Component {
  render() {
    return (
      <div className="header"
        style={{ backgroundImage: "url(/bingo_club.JPG)" }}
      >
            <div className="signOut">
              <AmplifySignOut button-text="SignOut"/>
            </div>
        </div>
    );
  }
}

export default Header;
