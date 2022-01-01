import React, { Component } from "react";
import Dropzone from "./dropzone";
import Progress from "./progress";
import "../css/Upload.css";
import awsconfig from "../aws-exports";
import Base64 from "Base64";
import { API } from "aws-amplify";

API.configure(awsconfig);

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      uploading: false,
      uploadProgress: {},
      successfullUploaded: false,
    };

    this.onFilesAdded = this.onFilesAdded.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.renderActions = this.renderActions.bind(this);
  }

  onFilesAdded(files) {
    this.setState((prevState) => ({
      files: prevState.files.concat(files),
    }));
  }

  sendRequest(jwtKey, file) {
    let data = loadDataToTable(jwtKey, file);
  }

  async uploadFiles() {
    this.setState({ uploadProgress: {}, uploading: true });
    const promises = [];
    this.state.files.forEach((file) => {
      promises.push(this.sendRequest(this.props.jwtKey, file));
    });
    try {
      await Promise.all(promises);
      this.setState({ successfullUploaded: true, uploading: false });
    } catch (e) {
      // Not Production ready! Do some error handling here instead...
      this.setState({ successfullUploaded: true, uploading: false });
    }
  }

  renderProgress(file) {
    const uploadProgress = this.state.uploadProgress[file.name];
    if (this.state.uploading || this.state.successfullUploaded) {
      return (
        <div className="ProgressWrapper">
          <Progress progress={uploadProgress ? uploadProgress.percentage : 0} />
          <img
            className="CheckIcon"
            alt="done"
            src="check_icon.svg"
            style={{
              opacity:
                uploadProgress && uploadProgress.state === "done" ? 0.5 : 0,
            }}
          />
        </div>
      );
    }
  }

  renderActions() {
    if (this.state.successfullUploaded) {
      return (
        <button
          onClick={() =>
            this.setState({ files: [], successfullUploaded: false })
          }
        >
          Clear
        </button>
      );
    } else {
      return (
        <button
          disabled={this.state.files.length < 0 || this.state.uploading}
          onClick={this.uploadFiles}
        >
          Upload
        </button>
      );
    }
  }

  render() {
    return (
      <div className="Upload">
        <div className="Content">
          <div>
            <Dropzone
              onFilesAdded={this.onFilesAdded}
              disabled={this.state.uploading || this.state.successfullUploaded}
            />
            <br></br>
            <div className="Actions">{this.renderActions()}</div>
          </div>
          <div className="Files">
            {this.state.files.map((file) => {
              return (
                <div key={file.name} className="Row">
                  <span className="Filename">{file.name}</span>
                  {this.renderProgress(file)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

async function loadDataToTable(jwtKey, file) {
  let data = "";
  let reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = async function () {
    data = Base64.btoa(reader.result);
    const myInit = {
      headers: {
        Authorization: "Bearer " + jwtKey,
      },
      body: {
        data: data,
        FileName: file.name,
      },
    };
    let response;
    response = await API.post("pbbntadmin", "/pbbntadmin", myInit)
      .then((result) => {
        return result.success;
      })
      .catch((err) => {
        console.log(err);
      });
    return response;
  };
}

export default Upload;
