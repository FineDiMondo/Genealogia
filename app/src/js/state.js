export class GestionalState {
  constructor() {
    this.state = {
      manifest: null,
      people: [],
      sample: null,
      env: "PROD",
      lastUpdate: null
    };
  }

  set(key, value) {
    this.state[key] = value;
    this.state.lastUpdate = new Date().toISOString();
  }

  get(key) {
    return this.state[key];
  }

  snapshot() {
    return { ...this.state };
  }
}

