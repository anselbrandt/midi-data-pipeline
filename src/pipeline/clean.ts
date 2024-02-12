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
  const multitrackDir = "./multitrack";
  const failedDir = "./failed";

  await mkdirs([outDir, multitrackDir, failedDir]);

  const files = await fs.readdir(dataDir);
  for (const file of files) {
    if (file === ".DS_Store") continue;
    const inpath = path.join(dataDir, file);
    const outpath = path.join(outDir, file);

    const multitrackMidiPath = path.join(multitrackDir, file);
    const multitrackJsonPath = path.join(
      multitrackDir,
      file.replace(".mid", ".json")
    );
    const failedMidiPath = path.join(failedDir, file);
    const failedJsonPath = path.join(failedDir, file.replace(".mid", ".json"));

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
        await fs.writeFile(outpath, midiBuffer);
      }
      if (tracks.length > 1) {
        await fs.writeFile(multitrackMidiPath, buffer);
        await fs.writeFile(multitrackJsonPath, JSON.stringify(cleanMidi));
      }
      if (tracks.length === 0) {
        await fs.writeFile(failedMidiPath, buffer);
        await fs.writeFile(failedJsonPath, JSON.stringify(midi));
      }
    } catch (error) {
      if (error) console.log(file, "may be corrupt");
    }
  }
};
