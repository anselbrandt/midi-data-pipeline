import path from "path";
import fs from "fs/promises";
import { read, write } from "midifile-ts";
import { MidiFile, AnyEvent } from "midifile-ts";
import { mkdirs } from "./scripts";

export const cleanFile = (midi: MidiFile): MidiFile => {
  if (midi.tracks.length === 1) return midi;

  const header = midi.header;
  const currTracks = midi.tracks;
  const tracks: AnyEvent[][] = [];

  for (const track of currTracks) {
    const isNotEmpty = track.some(
      (event) =>
        (event.type === "channel" && event.subtype === "noteOn") ||
        (event.type === "channel" && event.subtype === "noteOff")
    );
    const isDrums = track.some(
      (event) => event.type === "channel" && event.channel === 9
    );
    const isBass = track.some(
      (event) =>
        event.type === "channel" &&
        event.subtype === "programChange" &&
        [32, 33, 35, 37, 43].includes(event.value)
    );
    if (!isNotEmpty || isDrums || isBass) continue;
    tracks.push(track);
  }
  const reassigned = tracks.map((track) =>
    track.map((event) => {
      if (event.type === "channel") {
        return { ...event, channel: 0 };
      }
      return event;
    })
  );
  return { tracks: reassigned, header };
};

export const clean = async () => {
  const dataDir = "./data";
  const outDir = "./out";
  const failedDir = "./failed";
  const multitrackDir = "./multitrack";
  const midiDir = "./midi";

  await mkdirs([outDir, failedDir, multitrackDir, midiDir]);

  const files = await fs.readdir(dataDir);
  for (const i in files) {
    const file = files[i];
    if (file === ".DS_Store") continue;
    const inpath = path.join(dataDir, file);
    const outpath = path.join(outDir, `${i}.json`);
    const midiPath = path.join(midiDir, `${i}.mid`);

    const multitrackJsonPath = path.join(
      multitrackDir,
      file.replace(".mid", ".json")
    );
    const multitrackMidiPath = path.join(multitrackDir, file);

    const failedJsonPath = path.join(failedDir, file.replace(".mid", ".json"));
    const failedMidiPAth = path.join(failedDir, file);

    try {
      const buffer = await fs.readFile(inpath);
      const midi = read(buffer);
      const cleanMidi = cleanFile(midi);
      const tracks = cleanMidi.tracks;

      if (tracks.length === 1) {
        const midiBuffer = write(
          cleanMidi.tracks,
          cleanMidi.header.ticksPerBeat
        );
        await fs.writeFile(outpath, JSON.stringify(cleanMidi));
        await fs.writeFile(midiPath, midiBuffer);
      }

      if (tracks.length > 1) {
        await fs.writeFile(multitrackMidiPath, buffer);
        await fs.writeFile(multitrackJsonPath, JSON.stringify(cleanMidi));
      }
      if (tracks.length === 0) {
        await fs.writeFile(failedMidiPAth, buffer);
        await fs.writeFile(failedJsonPath, JSON.stringify(midi));
      }
    } catch (error) {
      if (error) console.log(file, "may be corrupt");
    }
  }
};
