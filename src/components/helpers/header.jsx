import React, { Component } from "react";
import { AmplifySignOut } from "@aws-amplify/ui-react";
// import jungle from "../../images/jungle_cover.png";

class Header extends Component {
  render() {
    return (
      // <img src={jungle} alt="The Jungle" />
      <div
        className="header"
        // style={{ backgroundImage: "url(../../images/jungle_cover.png)" }}
      >
        {/* <div className="signOut">
          <AmplifySignOut button-text="SignOut" />
        </div> */}
      </div>
    );
  }
}

export default Header;
