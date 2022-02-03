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
        <br/>
        <hr style={divStyle} />
        <br/>
      </div>
    );
  }
}

export default Divider;
