import fs from "fs/promises";
import path from "path";
import { read } from "midifile-ts";

interface Payload {
  firstTrack: any;
  files: any[];
}

export const getDupes = async () => {
  const files = await fs.readdir("./data");
  const map: Map<number, Payload> = new Map();
  const corruptFiles: string[] = [];
  console.log("Failed files logged below:");
  for (const file of files) {
    if (file === ".DS_Store") continue;
    try {
      const inpath = path.join("./data", file);
      const buffer = await fs.readFile(inpath);
      const size = buffer.length;
      const exists = map.has(size);
      if (exists) {
        const prev = map.get(size);
        const firstTrack = prev!.firstTrack;
        const midi = read(buffer);
        if (JSON.stringify(midi.tracks[0]) === JSON.stringify(firstTrack)) {
          const prevFiles = prev!.files;
          const payload: Payload = { firstTrack, files: [...prevFiles, file] };
          map.set(size, payload);
        }
      } else {
        const midi = read(buffer);
        const firstTrack = midi.tracks[0];
        map.set(size, {
          firstTrack,
          files: [file],
        });
      }
    } catch (error) {
      if (error) {
        console.log(file);
        corruptFiles.push(file);
      }
    }
  }
  const arr = Array.from(map);

  const dupes = arr
    .map((entry) => entry[1].files)
    .filter((entry) => entry.length > 1)
    .sort();
  await fs.writeFile("./output/corrupt.json", JSON.stringify(corruptFiles));
  await fs.writeFile("./output/dupes.json", JSON.stringify(dupes));
  return dupes;
};
