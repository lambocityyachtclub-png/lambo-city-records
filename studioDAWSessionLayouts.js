/*
 * LAMBO CITY RECORDS — SESSION STARTER LAYOUTS
 *
 * Practical track layouts for hip-hop beat production, vocal overdubs,
 * full-band tracking, and singer-songwriter sessions. These are session
 * data presets only; the user's final interface design remains separate.
 */

const layouts = [
  {
    id: "hip-hop-production",
    name: "Hip-Hop Beat Production",
    concept: "Build a beat from drums, 808/bass, samples, melodies, and printed references.",
    tempo: 100,
    tracks: [
      { name: "KICK", type: "audio", inputSource: "mpc", group: "DRUMS", volume: 92 },
      { name: "SNARE / CLAP", type: "audio", inputSource: "mpc", group: "DRUMS", volume: 88 },
      { name: "HI-HATS", type: "audio", inputSource: "mpc", group: "DRUMS", volume: 82 },
      { name: "PERCUSSION", type: "audio", inputSource: "mpc", group: "DRUMS", volume: 78 },
      { name: "808 / BASS", type: "instrument", inputSource: "mpc", group: "LOW END", volume: 88 },
      { name: "SAMPLE / CHOPS", type: "audio", inputSource: "mpc", group: "MUSIC", volume: 84 },
      { name: "MELODY / KEYS", type: "instrument", inputSource: "mic", group: "MUSIC", volume: 80 },
      { name: "TEXTURES / FX", type: "audio", inputSource: "mpc", group: "MUSIC", volume: 72 },
      { name: "BEAT PRINT", type: "audio", inputSource: "beatlab", group: "PRINTS", volume: 90 }
    ]
  },
  {
    id: "hip-hop-vocal-session",
    name: "Hip-Hop Vocal Overdubs",
    concept: "A clear vocal tracking layout for lead takes, hook doubles, ad-libs, harmonies, and beat reference.",
    tempo: 100,
    tracks: [
      { name: "INSTRUMENTAL REFERENCE", type: "audio", inputSource: "beatlab", group: "REFERENCE", volume: 88 },
      { name: "LEAD VOCAL", type: "audio", inputSource: "mic", group: "LEAD", volume: 88 },
      { name: "LEAD VOCAL COMP", type: "audio", inputSource: "mic", group: "LEAD", volume: 88 },
      { name: "HOOK VOCAL", type: "audio", inputSource: "mic", group: "HOOK", volume: 84 },
      { name: "HOOK DOUBLE LEFT", type: "audio", inputSource: "mic", group: "DOUBLES", volume: 70, pan: -0.35 },
      { name: "HOOK DOUBLE RIGHT", type: "audio", inputSource: "mic", group: "DOUBLES", volume: 70, pan: 0.35 },
      { name: "VERSE DOUBLES", type: "audio", inputSource: "mic", group: "DOUBLES", volume: 68 },
      { name: "AD-LIBS", type: "audio", inputSource: "mic", group: "VOCAL LAYERS", volume: 72 },
      { name: "HARMONIES", type: "audio", inputSource: "mic", group: "VOCAL LAYERS", volume: 68 }
    ]
  },
  {
    id: "full-band-tracking",
    name: "Full Band Tracking",
    concept: "Separate microphone and direct inputs for a conventional live rhythm section, instruments, and vocals.",
    tempo: 110,
    tracks: [
      { name: "KICK IN", type: "audio", inputSource: "mic", group: "DRUMS", volume: 86 },
      { name: "SNARE TOP", type: "audio", inputSource: "mic", group: "DRUMS", volume: 84 },
      { name: "SNARE BOTTOM", type: "audio", inputSource: "mic", group: "DRUMS", volume: 72 },
      { name: "RACK TOM", type: "audio", inputSource: "mic", group: "DRUMS", volume: 76 },
      { name: "FLOOR TOM", type: "audio", inputSource: "mic", group: "DRUMS", volume: 76 },
      { name: "OVERHEAD LEFT", type: "audio", inputSource: "mic", group: "DRUMS", volume: 78, pan: -0.65 },
      { name: "OVERHEAD RIGHT", type: "audio", inputSource: "mic", group: "DRUMS", volume: 78, pan: 0.65 },
      { name: "ROOM", type: "audio", inputSource: "mic", group: "DRUMS", volume: 64 },
      { name: "BASS DI", type: "audio", inputSource: "mic", group: "BASS", volume: 86 },
      { name: "BASS AMP", type: "audio", inputSource: "mic", group: "BASS", volume: 72 },
      { name: "GUITAR LEFT", type: "audio", inputSource: "mic", group: "GUITARS", volume: 78, pan: -0.5 },
      { name: "GUITAR RIGHT", type: "audio", inputSource: "mic", group: "GUITARS", volume: 78, pan: 0.5 },
      { name: "KEYS LEFT", type: "audio", inputSource: "mic", group: "KEYS", volume: 76, pan: -0.35 },
      { name: "KEYS RIGHT", type: "audio", inputSource: "mic", group: "KEYS", volume: 76, pan: 0.35 },
      { name: "LEAD VOCAL", type: "audio", inputSource: "mic", group: "VOCALS", volume: 84 },
      { name: "BACKING VOCALS", type: "audio", inputSource: "mic", group: "VOCALS", volume: 72 }
    ]
  },
  {
    id: "singer-songwriter",
    name: "Singer-Songwriter",
    concept: "A focused acoustic arrangement for a lead vocal, acoustic instruments, harmonies, and percussion.",
    tempo: 92,
    tracks: [
      { name: "LEAD VOCAL", type: "audio", inputSource: "mic", group: "VOCALS", volume: 88 },
      { name: "ACOUSTIC GUITAR", type: "audio", inputSource: "mic", group: "INSTRUMENTS", volume: 82 },
      { name: "PIANO", type: "instrument", inputSource: "mic", group: "INSTRUMENTS", volume: 78 },
      { name: "BASS", type: "audio", inputSource: "mic", group: "INSTRUMENTS", volume: 78 },
      { name: "PERCUSSION", type: "audio", inputSource: "mic", group: "RHYTHM", volume: 72 },
      { name: "HARMONY LEFT", type: "audio", inputSource: "mic", group: "VOCAL LAYERS", volume: 68, pan: -0.3 },
      { name: "HARMONY RIGHT", type: "audio", inputSource: "mic", group: "VOCAL LAYERS", volume: 68, pan: 0.3 }
    ]
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function listStudioDAWSessionLayouts() {
  return layouts.map(({ id, name, concept, tempo, tracks }) => ({
    id,
    name,
    concept,
    tempo,
    trackCount: tracks.length
  }));
}

export function applyStudioDAWSessionLayout(workspace, layoutId) {
  if (!workspace || !Array.isArray(workspace.tracks) ||
      typeof workspace.createTrack !== "function" ||
      typeof workspace.stopAll !== "function") {
    throw new Error("A valid LAMBO CITY DAW workspace is required.");
  }
  if (workspace.pendingRecording ||
      (typeof workspace.isTrackRecording === "function" && workspace.isTrackRecording())) {
    throw new Error("Stop the active or scheduled recording before loading a session layout.");
  }

  const layout = layouts.find(item => item.id === layoutId);
  if (!layout) throw new Error("The selected LAMBO CITY session layout was not found.");

  workspace.recordHistory?.("Apply session layout");
  workspace.stopAll();
  workspace.tracks = [];
  workspace.nextTrackId = 1;

  for (const definition of layout.tracks) {
    const track = workspace.createTrack(definition.type, definition.name);
    const groupName = definition.group || "TRACKS";
    const groupId = "lc-group-" + groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    Object.assign(track, {
      volume: definition.volume ?? 80,
      pan: definition.pan ?? 0,
      inputSource: definition.inputSource || "mic",
      groupId,
      groupName,
      groupCollapsed: false,
      armed: false,
      muted: false,
      solo: false,
      clips: [],
      midiNotes: [],
      automation: { volume: [] }
    });
  }

  workspace.tempo = Math.max(60, Math.min(180, Number(layout.tempo) || 100));
  workspace.sessionTemplateId = layout.id;
  workspace.sessionTemplateName = layout.name;
  workspace.selectedTrackId = null;
  workspace.selectedClipId = null;
  workspace.selectedRegionIds = [];
  workspace.render?.();
  workspace.scheduleProjectAutosave?.();
  workspace.status?.(layout.name + " layout loaded · " + layout.tracks.length + " production tracks ready.");
  return {
    id: layout.id,
    name: layout.name,
    concept: layout.concept,
    tempo: workspace.tempo,
    trackCount: workspace.tracks.length
  };
}

export default {
  list: listStudioDAWSessionLayouts,
  apply: applyStudioDAWSessionLayout
};
