import fs from "fs/promises";
import path from "path";
import { midiToSequenceProto, quantizeNoteSequence } from "./midi";
import { mkdirs } from "./pipeline";
import { read } from "midifile-ts";

async function main() {
  const dir = "./midi";
  const outdir = "./playable";
  const faildir = "./notplayable";
  await mkdirs([outdir, faildir]);
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const buffer = await fs.readFile(filePath);
    try {
      const ns = midiToSequenceProto(buffer);
      const sequence = quantizeNoteSequence(ns, 4);
      if (sequence.totalTime > 0) {
        const outpath = path.join(outdir, file);
        await fs.writeFile(outpath, buffer);
      }
    } catch (error) {
      if (error) {
        const failpath = path.join(faildir, file.replace(".mid", ".json"));
        const midi = read(buffer);
        await fs.writeFile(failpath, JSON.stringify(midi));
      }
    }
  }
}

main().catch((error) => console.log(error));
