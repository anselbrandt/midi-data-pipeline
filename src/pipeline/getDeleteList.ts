import fs from "fs/promises";
import path from "path";

const alphaLength = (file: string) => {
  const str = file.replace(".mid", "");
  const lastChar = str.slice(-1);
  const isNotNum = isNaN(parseInt(lastChar));
  const punc = ["'", "_", "-"];
  const isNotPunc = !punc.includes(lastChar);
  if (isNotNum && isNotPunc) return str.length;
  return alphaLength(str.slice(0, -1));
};

export const getDeleteList = async (dupes: string[][]) => {
  const deleteList = dupes
    .map((list) => {
      const [first, ...rest] = list.sort(
        (a, b) => alphaLength(b) - alphaLength(a)
      );
      return rest;
    })
    .flat();
  await fs.writeFile("./output/delete.json", JSON.stringify(deleteList));
  return deleteList;
};

export const deleteDupes = async (dupes: string[]) => {
  for (const file of dupes) {
    const filepath = path.join("./data", file);
    console.log("deleting", file);
    await fs.unlink(filepath);
  }
};
