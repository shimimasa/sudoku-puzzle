export class AudioManager {
  constructor({ bgmEnabled = true, sfxEnabled = true, bgmVolume = 1, sfxVolume = 1 } = {}) {
    this.bgmEnabled = bgmEnabled;
    this.sfxEnabled = sfxEnabled;
    this.bgmVolume = bgmVolume;
    this.sfxVolume = sfxVolume;
  }

  setBgmEnabled(enabled) {
    this.bgmEnabled = !!enabled;
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = !!enabled;
  }

  setBgmVolume(volume) {
    this.bgmVolume = Number.isFinite(volume) ? volume : this.bgmVolume;
  }

  setSfxVolume(volume) {
    this.sfxVolume = Number.isFinite(volume) ? volume : this.sfxVolume;
  }

  playBgm(_name, _options = {}) {}

  stopBgm() {}

  playSfx(_name) {}
}

let audioManager = null;

export function initAudioManager(settings = {}) {
  audioManager = new AudioManager(settings);
  return audioManager;
}

export function getAudioManager() {
  return audioManager;
}
