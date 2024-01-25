import {
  downloadData,
  getDupes,
  retry,
  getDeleteList,
  deleteDupes,
} from "./pipeline";

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
}

main().catch((error) => console.log(error));
