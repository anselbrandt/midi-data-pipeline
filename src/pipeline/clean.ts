import path from "path";
import fs from "fs/promises";
import { read, write } from "midifile-ts";
import { mkdirs } from "./scripts";
import { cleanFile } from "./utils";

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

      if (tracks.length === 1 || tracks.length === 2) {
        const midiBuffer = write(
          cleanMidi.tracks,
          cleanMidi.header.ticksPerBeat
        );
        await fs.writeFile(outpath, midiBuffer);
      }
      if (tracks.length > 2) {
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
