export default class Hls {
  constructor(config = {}) {
    this.config = config;
  }

  attachMedia(video) {}
  loadSource(source) {}
  destroy() {}
  on(event, handler) {}
  off(event, handler) {}
}

export { Hls };
