import React, { Component } from "react";
import { AmplifySignOut } from "@aws-amplify/ui-react";

class Header extends Component {
  render() {
    return (
      // <img src={jungle} alt="The Jungle" />
      <div className="header">
        {/* <div className="signOut">
          <AmplifySignOut button-text="SignOut" />
        </div> */}
      </div>
    );
  }
}

export default Header;
