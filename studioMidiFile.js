// LAMBO CITY RECORDS — Standard MIDI File utilities (SMF 0/1).
// Notes use the Studio's bar-relative representation and remain portable in .lcp.
const MAX_MIDI_BYTES = 8 * 1024 * 1024;
const MAX_MIDI_TRACKS = 64;
const MAX_MIDI_EVENTS = 100000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function readU16(view, offset) { return view.getUint16(offset, false); }
function readU32(view, offset) { return view.getUint32(offset, false); }
function readVar(bytes, state) {
  let value = 0;
  for (let count = 0; count < 4; count += 1) {
    if (state.offset >= bytes.length) throw new Error("The MIDI file is truncated.");
    const byte = bytes[state.offset++];
    value = (value << 7) | (byte & 0x7f);
    if (!(byte & 0x80)) return value;
  }
  throw new Error("The MIDI file contains an invalid variable-length value.");
}
function writeVar(value) {
  let number = Math.max(0, Math.floor(value));
  const bytes = [number & 0x7f];
  while ((number >>= 7) > 0) bytes.unshift((number & 0x7f) | 0x80);
  return bytes;
}
function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}
function pushText(target, value) {
  for (let i = 0; i < value.length; i += 1) target.push(value.charCodeAt(i) & 0xff);
}
function pushU16(target, value) { target.push((value >> 8) & 0xff, value & 0xff); }
function pushU32(target, value) { target.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff); }

export function parseStudioMidi(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 14 || arrayBuffer.byteLength > MAX_MIDI_BYTES) {
    throw new Error("Choose a valid MIDI file under 8 MB.");
  }
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  if (ascii(bytes, 0, 4) !== "MThd" || readU32(view, 4) < 6) throw new Error("This is not a valid Standard MIDI File.");
  const headerLength = readU32(view, 4);
  const format = readU16(view, 8);
  const trackCount = readU16(view, 10);
  const division = readU16(view, 12);
  if (![0, 1].includes(format) || !trackCount || trackCount > MAX_MIDI_TRACKS || division & 0x8000 || !division) {
    throw new Error("This MIDI format or time division is not supported. Use a PPQ-based MIDI Type 0 or Type 1 file.");
  }
  const ppq = division;
  let offset = 8 + headerLength;
  let tempo = 120;
  let timeSignature = { numerator: 4, denominator: 4 };
  let eventCount = 0;
  const tracks = [];

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    if (ascii(bytes, offset, 4) !== "MTrk" || offset + 8 > bytes.length) throw new Error("A MIDI track chunk is missing or truncated.");
    const length = readU32(view, offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > bytes.length) throw new Error("A MIDI track chunk is truncated.");
    const state = { offset: start };
    let tick = 0;
    let runningStatus = 0;
    let name = "MIDI " + (trackIndex + 1);
    const active = new Map();
    const notes = [];

    while (state.offset < end) {
      tick += readVar(bytes, state);
      if (++eventCount > MAX_MIDI_EVENTS) throw new Error("This MIDI file contains too many events.");
      let status = bytes[state.offset];
      if (status < 0x80) {
        if (!runningStatus) throw new Error("The MIDI file contains an invalid running status.");
        status = runningStatus;
      } else {
        state.offset += 1;
      }

      if (status === 0xff) {
        runningStatus = 0;
        if (state.offset >= end) throw new Error("The MIDI meta event is truncated.");
        const type = bytes[state.offset++];
        const size = readVar(bytes, state);
        if (state.offset + size > end) throw new Error("The MIDI meta event is truncated.");
        if (type === 0x03) name = new TextDecoder().decode(bytes.subarray(state.offset, state.offset + size)) || name;
        if (type === 0x51 && size === 3 && trackIndex === 0) {
          const micros = (bytes[state.offset] << 16) | (bytes[state.offset + 1] << 8) | bytes[state.offset + 2];
          if (micros > 0) tempo = 60000000 / micros;
        }
        if (type === 0x58 && size >= 2 && trackIndex === 0) {
          const denominator = 2 ** bytes[state.offset + 1];
          const numerator = bytes[state.offset];
          if (numerator >= 1 && numerator <= 12 && [2, 4, 8, 16].includes(denominator)) timeSignature = { numerator, denominator };
        }
        state.offset += size;
        if (type === 0x2f) break;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        runningStatus = 0;
        const size = readVar(bytes, state);
        state.offset += size;
        if (state.offset > end) throw new Error("A MIDI system-exclusive event is truncated.");
        continue;
      }
      if (status < 0x80 || status >= 0xf0) throw new Error("The MIDI file contains an unsupported event.");
      runningStatus = status;
      const command = status & 0xf0;
      const channel = status & 0x0f;
      const data1 = bytes[state.offset++];
      const data2 = command === 0xc0 || command === 0xd0 ? 0 : bytes[state.offset++];
      if (state.offset > end) throw new Error("A MIDI channel event is truncated.");
      if (command === 0x90 && data2 > 0) {
        const key = channel + ":" + data1;
        const queue = active.get(key) || [];
        queue.push({ tick, velocity: data2 });
        active.set(key, queue);
      } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
        const key = channel + ":" + data1;
        const queue = active.get(key);
        const noteOn = queue?.shift();
        if (noteOn && tick > noteOn.tick) notes.push({ pitch: data1, startTick: noteOn.tick, durationTicks: tick - noteOn.tick, velocity: noteOn.velocity / 127 });
      }
    }
    for (const [key, queue] of active) {
      const pitch = Number(key.split(":")[1]);
      for (const note of queue) notes.push({ pitch, startTick: note.tick, durationTicks: Math.max(1, ppq / 4), velocity: note.velocity / 127 });
    }
    const barTicks = ppq * timeSignature.numerator * (4 / timeSignature.denominator);
    tracks.push({
      name: name.slice(0, 64),
      notes: notes.map(note => ({
        pitch: note.pitch,
        startBar: clamp(1 + note.startTick / barTicks, 1, 128),
        lengthBars: clamp(note.durationTicks / barTicks, 0.001, 16),
        velocity: clamp(note.velocity, 0.01, 1)
      }))
    });
    offset = end;
  }
  return { format, ppq, tempo: clamp(tempo, 20, 300), timeSignature, tracks };
}

export function createStudioMidiBlob({ tracks = [], tempo = 100, timeSignature = "4/4", ppq = 960 } = {}) {
  if (!Number.isInteger(ppq) || ppq < 24 || ppq > 9600) throw new Error("MIDI PPQ must be between 24 and 9600.");
  const [numeratorRaw, denominatorRaw] = String(timeSignature).split("/");
  const numerator = clamp(Number(numeratorRaw) || 4, 1, 12);
  const denominator = [2, 4, 8, 16].includes(Number(denominatorRaw)) ? Number(denominatorRaw) : 4;
  const validTracks = tracks.filter(track => Array.isArray(track.midiNotes) && track.midiNotes.length);
  if (!validTracks.length) throw new Error("There are no MIDI notes to export.");
  if (validTracks.length > MAX_MIDI_TRACKS) throw new Error("A MIDI file can contain at most 64 exported tracks.");
  const micros = Math.round(60000000 / clamp(Number(tempo) || 100, 20, 300));
  const chunks = [];
  const conductor = [];
  conductor.push(...writeVar(0), 0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff);
  conductor.push(...writeVar(0), 0xff, 0x58, 0x04, numerator, Math.log2(denominator), 24, 8);
  conductor.push(...writeVar(0), 0xff, 0x2f, 0x00);
  chunks.push(conductor);

  const barTicks = ppq * numerator * (4 / denominator);
  for (let trackIndex = 0; trackIndex < validTracks.length; trackIndex += 1) {
    const track = validTracks[trackIndex];
    const events = [];
    const nameBytes = Array.from(new TextEncoder().encode(String(track.name || "MIDI " + (trackIndex + 1)).slice(0, 64)));
    events.push({ tick: 0, priority: -2, bytes: [0xff, 0x03, ...writeVar(nameBytes.length), ...nameBytes] });
    for (const note of track.midiNotes.slice(0, 4096)) {
      const pitch = Number(note.pitch);
      const startBar = Number(note.startBar);
      const lengthBars = Number(note.lengthBars);
      if (!Number.isInteger(pitch) || pitch < 0 || pitch > 127 || !Number.isFinite(startBar) || startBar < 1 || !Number.isFinite(lengthBars) || lengthBars <= 0) continue;
      const start = Math.round((startBar - 1) * barTicks);
      const end = start + Math.max(1, Math.round(lengthBars * barTicks));
      const velocity = Math.round(clamp(Number(note.velocity ?? 0.8), 0.01, 1) * 127);
      events.push({ tick: start, priority: 1, bytes: [0x90, pitch, velocity] });
      events.push({ tick: end, priority: 0, bytes: [0x80, pitch, 0] });
    }
    events.sort((a, b) => a.tick - b.tick || a.priority - b.priority);
    const data = [];
    let lastTick = 0;
    for (const event of events) {
      data.push(...writeVar(event.tick - lastTick), ...event.bytes);
      if (event.bytes[0] === 0xff) continue;
      lastTick = event.tick;
    }
    data.push(...writeVar(0), 0xff, 0x2f, 0x00);
    chunks.push(data);
  }
  const output = [];
  pushText(output, "MThd"); pushU32(output, 6); pushU16(output, 1); pushU16(output, chunks.length); pushU16(output, ppq);
  for (const chunk of chunks) { pushText(output, "MTrk"); pushU32(output, chunk.length); output.push(...chunk); }
  return new Blob([new Uint8Array(output)], { type: "audio/midi" });
}

export function quantizeStudioMidiNotes(notes = [], grid = 0.25, strength = 1) {
  const step = Number(grid);
  const amount = clamp(Number(strength), 0, 1);
  if (!Number.isFinite(step) || step <= 0 || step > 4) throw new Error("MIDI quantize grid must be between 1/4 bar and 4 bars.");
  return notes.map(note => {
    const start = Number(note.startBar) || 1;
    const end = start + Math.max(0.001, Number(note.lengthBars) || 0.25);
    const quantizedStart = Math.max(1, Math.round((start - 1) / step) * step + 1);
    const quantizedEnd = Math.max(quantizedStart + 0.001, Math.round((end - 1) / step) * step + 1);
    return { ...note, startBar: start + (quantizedStart - start) * amount, lengthBars: Math.max(0.001, (end + (quantizedEnd - end) * amount) - (start + (quantizedStart - start) * amount)) };
  });
}

export function swingStudioMidiNotes(notes = [], amount = 0.5, subdivision = 0.125) {
  const swing = clamp(Number(amount), 0, 0.75);
  const step = Number(subdivision);
  if (!Number.isFinite(step) || step <= 0 || step > 1) throw new Error("MIDI swing subdivision must be between 1/64 and one bar.");
  return notes.map(note => {
    const position = Math.max(0, Number(note.startBar) - 1);
    const pair = step * 2;
    const within = position % pair;
    const isOffbeat = within >= step * 0.5 && within < step * 1.5;
    if (!isOffbeat) return { ...note };
    const target = Math.floor(position / pair) * pair + step * (1 + swing);
    return { ...note, startBar: 1 + target };
  });
}

export function humanizeStudioMidiNotes(notes = [], timingBars = 0.008, velocityAmount = 0.08, random = Math.random) {
  const timing = clamp(Number(timingBars) || 0, 0, 0.125);
  const velocity = clamp(Number(velocityAmount) || 0, 0, 0.5);
  return notes.map(note => ({
    ...note,
    startBar: Math.max(1, (Number(note.startBar) || 1) + (random() * 2 - 1) * timing),
    velocity: clamp(Number(note.velocity ?? 0.8) + (random() * 2 - 1) * velocity, 0.01, 1)
  }));
}
