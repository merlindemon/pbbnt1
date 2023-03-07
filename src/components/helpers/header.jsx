import React, { Component } from "react";
import { AmplifySignOut } from "@aws-amplify/ui-react";

class Header extends Component {
  render() {
    return (
      <div
        className="header"
        style={{ backgroundImage: "url(/jungle_cover.png)" }}
      >
        {/* <div className="signOut">
          <AmplifySignOut button-text="SignOut" />
        </div> */}
      </div>
    );
  }
}

export default Header;
