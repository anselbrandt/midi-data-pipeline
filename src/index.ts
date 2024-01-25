import fs from "fs/promises";
import path from "path";
import { midiToSequenceProto, quantizeNoteSequence } from "./midi";
import { mkdirs } from "./pipeline";

async function main() {
  const urls = [
    "https://bushgrafts.com/midi/",
    "https://bushgrafts.com/jazz/Midi%20site/",
    "https://bushgrafts.com/jazz/",
  ];
  // await downloadData(urls)
  // await retry();
  // const dupes = await getDupes();
  // const deleteList = await getDeleteList(dupes);
  // await deleteDupes(deleteList);
  // await clean();
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
        const failpath = path.join(faildir, file);
        await fs.writeFile(failpath, buffer);
      }
    }
  }
}

main().catch((error) => console.log(error));
