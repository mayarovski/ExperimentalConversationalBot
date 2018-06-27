'use strict';

const tf = require('@tensorflow/tfjs');
const fs = require('fs');

const MANIFEST_FILE = 'manifest.json';

var exports = module.exports = {};

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
  }
  return ab;
}

exports.CheckpointLoader = class CheckpointLoader {
  constructor(urlPath) {
    this.urlPath = urlPath;
    if (this.urlPath.charAt(this.urlPath.length - 1) !== '/') {
      this.urlPath += '/';
    }
  }

  loadManifest() {
    return new Promise((resolve) => {
      this.checkpointManifest = JSON.parse(fs.readFileSync('./' + this.urlPath + MANIFEST_FILE));
      resolve();
    });
  }

  getCheckpointManifest() {
    if (this.checkpointManifest == null) {
      return new Promise((resolve) => {
        this.loadManifest().then(() => {
          resolve(this.checkpointManifest);
        });
      });
    }
    return new Promise((resolve) => {
      resolve(this.checkpointManifest);
    });
  }

  getAllVariables() {
    if (this.variables != null) {
      return new Promise((resolve) => {
        resolve(this.variables);
      });
    }

    return new Promise((resolve) => {
      this.getCheckpointManifest().then(() => {
        const variableNames = Object.keys(this.checkpointManifest);
        const variablePromises = [];
        for (let i = 0; i < variableNames.length; i += 1) {
          variablePromises.push(this.getVariable(variableNames[i]));
        }
        Promise.all(variablePromises).then((variables) => {
          this.variables = {};
          for (let i = 0; i < variables.length; i += 1) {
            this.variables[variableNames[i]] = variables[i];
          }
          resolve(this.variables);
        });
      });
    });
  }
  getVariable(varName) {
    if (!(varName in this.checkpointManifest)) {
      throw new Error(`Cannot load non-existant variable ${varName}`);
    }
    const variableRequestPromiseMethod = (resolve) => {
      const fname = this.checkpointManifest[varName].filename;
      const values = new Float32Array(toArrayBuffer(fs.readFileSync('./' + this.urlPath + fname)));
      const tensor = tf.Tensor.make(this.checkpointManifest[varName].shape, { values });
      resolve(tensor);
    };
    if (this.checkpointManifest == null) {
      return new Promise((resolve) => {
        this.loadManifest().then(() => {
          new Promise(variableRequestPromiseMethod).then(resolve);
        });
      });
    }
    return new Promise(variableRequestPromiseMethod);
  }
}
