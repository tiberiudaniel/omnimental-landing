import { MutableRefObject, useEffect, useRef } from "react";

type AudioLayer = {
  audio: HTMLAudioElement;
  fadeId: number | null;
};

type IntroAudioEngine = {
  bed: AudioLayer;
  chaos: AudioLayer;
  stable: AudioLayer;
  pivot: AudioLayer;
};

function createLayer(src: string, loop: boolean): AudioLayer | null {
  if (typeof window === "undefined") return null;
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = loop;
  audio.volume = 0;
  audio.currentTime = 0;
  return { audio, fadeId: null };
}

function createEngine(): IntroAudioEngine | null {
  const bed = createLayer("/audio/intro/v1/bed_drone.mp3", true);
  const chaos = createLayer("/audio/intro/v1/chaos_pulse.mp3", true);
  const stable = createLayer("/audio/intro/v1/stable_tone.mp3", true);
  const pivot = createLayer("/audio/intro/v1/pivot_hit.mp3", false);
  if (!bed || !chaos || !stable || !pivot) return null;
  return { bed, chaos, stable, pivot };
}

function ensurePlaying(layer: AudioLayer) {
  if (!layer.audio.paused || layer.audio.currentTime > 0) return;
  layer.audio.currentTime = 0;
  layer.audio.play().catch(() => undefined);
}

function stopLayer(layer: AudioLayer) {
  if (layer.fadeId != null) {
    cancelAnimationFrame(layer.fadeId);
    layer.fadeId = null;
  }
  layer.audio.pause();
  layer.audio.volume = 0;
  layer.audio.currentTime = 0;
}

function fadeTo(layer: AudioLayer, targetVolume: number, durationMs: number, stopAfter?: boolean) {
  if (layer.fadeId != null) {
    cancelAnimationFrame(layer.fadeId);
    layer.fadeId = null;
  }
  const startVolume = layer.audio.volume;
  const delta = targetVolume - startVolume;
  if (Math.abs(delta) < 0.001 || durationMs <= 0) {
    layer.audio.volume = targetVolume;
    if (stopAfter && targetVolume === 0) {
      stopLayer(layer);
    }
    return;
  }
  const startTime = performance.now();
  const tick = () => {
    const now = performance.now();
    const progress = Math.min(1, (now - startTime) / durationMs);
    layer.audio.volume = startVolume + delta * progress;
    if (progress < 1) {
      layer.fadeId = requestAnimationFrame(tick);
    } else {
      layer.fadeId = null;
      if (stopAfter && targetVolume === 0) {
        stopLayer(layer);
      }
    }
  };
  layer.fadeId = requestAnimationFrame(tick);
}

function stopEngine(engine: IntroAudioEngine | null) {
  if (!engine) return;
  stopLayer(engine.bed);
  stopLayer(engine.chaos);
  stopLayer(engine.stable);
  stopLayer(engine.pivot);
}

function applyTimeline(
  engine: IntroAudioEngine,
  progressMs: number,
  pivotTriggeredRef: MutableRefObject<boolean>,
) {
  const { bed, chaos, stable, pivot } = engine;

  if ((progressMs >= 0 && progressMs < 7200) || (progressMs >= 11000 && progressMs < 14500)) {
    ensurePlaying(bed);
    const target = progressMs < 3600 ? 0.14 : progressMs < 14500 ? 0.1 : 0;
    fadeTo(bed, target, 250);
  } else if (progressMs >= 14500) {
    fadeTo(bed, 0, 250, true);
  } else {
    fadeTo(bed, 0, 150, true);
  }

  if (progressMs >= 3600 && progressMs < 7200) {
    ensurePlaying(chaos);
    fadeTo(chaos, 0.1, 200);
  } else {
    fadeTo(chaos, 0, 120, true);
  }

  if (progressMs >= 7200 && progressMs < 7500) {
    fadeTo(bed, 0, 120, true);
    fadeTo(chaos, 0, 120, true);
  }

  if (progressMs >= 7500 && progressMs < 11000) {
    ensurePlaying(stable);
    fadeTo(stable, 0.13, 150);
  } else {
    fadeTo(stable, 0, 200, true);
  }

  if (progressMs >= 7500 && !pivotTriggeredRef.current) {
    pivotTriggeredRef.current = true;
    pivot.audio.volume = 0.22;
    pivot.audio.currentTime = 0;
    pivot.audio.play().catch(() => undefined);
  }
}

export function useIntroAudioAssets(enabled: boolean, progressMs: number) {
  const engineRef = useRef<IntroAudioEngine | null>(null);
  const pivotTriggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      pivotTriggeredRef.current = false;
      stopEngine(engineRef.current);
      engineRef.current = null;
      return;
    }
    if (!engineRef.current) {
      engineRef.current = createEngine();
    }
    return () => {
      stopEngine(engineRef.current);
      engineRef.current = null;
      pivotTriggeredRef.current = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const engine = engineRef.current;
    if (!engine) return;
    applyTimeline(engine, progressMs, pivotTriggeredRef);
  }, [enabled, progressMs]);
}
