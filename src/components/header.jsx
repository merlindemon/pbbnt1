import React, { Component } from "react";
import { AmplifySignOut } from "@aws-amplify/ui-react";
import Divider from "./divider";
// import background from "../../pubic/pokerrrr2logo.webp";

class Header extends Component {
  render() {
    return (
      <div
        class="header"
        style={{ backgroundImage: "url(/pokerrrr2logo.webp)" }}
      >
        {/* <h1>Welcome {this.props.username}!</h1> */}
        <div class="signOut">
          <AmplifySignOut button-text="SignOut"></AmplifySignOut>
        </div>
        <Divider />
      </div>
    );
  }
}

export default Header;
