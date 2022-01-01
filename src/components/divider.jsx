import React, { Component } from "react";

class Divider extends Component {
  render() {
    const divStyle = {
      color: "black",
      width: "100%",
      size: "2",
    };
    return (
      <div>
        <br></br>
        <hr style={divStyle} />
        <br></br>
      </div>
    );
  }
}

export default Divider;
