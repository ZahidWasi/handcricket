// Sound Effects & Audio Manager
class AudioManager {
  constructor() {
    this.muted = localStorage.getItem('hc_muted') === 'true';
    this.sounds = {
      click: new Audio('assets/click.mp3'),
      coinFlip: new Audio('assets/coin-flip.mp3'),
      batHit: new Audio('assets/bat-hit.mp3'),
      wicket: new Audio('assets/wicket.mp3'),
      cheer: new Audio('assets/cheer.mp3')
    };

    // Preload audio and set volume levels
    Object.entries(this.sounds).forEach(([key, audio]) => {
      audio.preload = 'auto';
      audio.volume = key === 'cheer' ? 0.6 : 0.85;
    });
  }

  play(soundName) {
    if (this.muted) return;
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => {
        // Autoplay policy or user interaction needed
        console.warn('Audio play prevented:', err);
      });
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('hc_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

const audioManager = new AudioManager();
