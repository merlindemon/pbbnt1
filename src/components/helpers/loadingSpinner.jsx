import Loader from "react-loader-spinner";
import React from "react";

class LoadingSpinner extends React.Component {
  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Loader type="ThreeDots" color="#FDF482" height="100" width="100" />
      </div>
    );
  }
}

export default LoadingSpinner;
