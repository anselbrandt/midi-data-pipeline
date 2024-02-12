import path from "path";
import fs from "fs/promises";
import { read, write } from "midifile-ts";
import { mkdirs } from "./pipeline/scripts";

async function debug() {
  console.log("debug");
}

debug().catch((error) => console.log(error));
