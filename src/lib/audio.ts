import { Howl, Howler } from "howler";
export type SoundLevel = "on" | "low" | "mute";
class AudioDirector {
  private ambience?: Howl;
  private effects = new Map<string, Howl>();
  private level: SoundLevel = "mute";
  setLevel(level: SoundLevel) {
    this.level = level;
    if (level === "mute") {
      Howler.mute(true);
      return;
    }
    Howler.mute(false);
    Howler.volume(0.55);
    if (!this.ambience) {
      this.ambience = new Howl({
        src: ["/assets/audio/audio_circo.mp3"],
        loop: true,
        volume: 0,
        onloaderror: () => console.warn("Ambiência indisponível"),
      });
    }
    if (!this.ambience.playing()) this.ambience.play();
    this.ambience.fade(
      this.ambience.volume(),
      level === "low" ? 0.07 : 0.18,
      900,
    );
  }
  effect(name: "curtain-open" | "update-tick" | "finale-sting") {
    if (this.level === "mute") return;
    let sound = this.effects.get(name);
    if (!sound) {
      sound = new Howl({
        src: [`/assets/audio/astro-change-${name}.wav`],
        volume: name === "finale-sting" ? 0.32 : 0.2,
      });
      this.effects.set(name, sound);
    }
    sound.play();
    if (name === "finale-sting" && this.ambience)
      this.ambience.fade(this.ambience.volume(), 0.07, 250);
  }
}
export const audio = new AudioDirector();

