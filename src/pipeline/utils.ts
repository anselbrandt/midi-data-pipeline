import { MidiFile, AnyEvent } from "midifile-ts";

const tracksToPiano = (tracks: AnyEvent[][]) =>
  tracks.map((track) =>
    track
      .map((event) => {
        if (event.type === "channel") {
          return { ...event, channel: 0 };
        }
        return event;
      })
      .filter(
        (event) =>
          !(event.type === "channel" && event.subtype === "programChange")
      )
      .filter(
        (event) =>
          !(
            event.type === "channel" &&
            event.subtype === "controller" &&
            event.controllerType === 7
          )
      )
      .filter(
        (event) =>
          !(
            event.type === "channel" &&
            event.subtype === "controller" &&
            event.controllerType === 10
          )
      )
  );

const isNotEmpty = (track: AnyEvent[]) =>
  track.some(
    (event) =>
      (event.type === "channel" && event.subtype === "noteOn") ||
      (event.type === "channel" && event.subtype === "noteOff")
  );

const isDrums = (track: AnyEvent[]) =>
  track.some((event) => event.type === "channel" && event.channel === 9);

const isBass = (track: AnyEvent[]) =>
  track.some(
    (event) =>
      event.type === "channel" &&
      event.subtype === "programChange" &&
      [32, 33, 35, 37, 43].includes(event.value)
  );

const isMeta = (track: AnyEvent[]) =>
  track.every((event) => event.type === "meta");

export const cleanFile = (midi: MidiFile): MidiFile => {
  const header = midi.header;
  const currTracks = midi.tracks;
  const meta = isMeta(midi.tracks[0]) ? midi.tracks[0] : null;

  const tracks: AnyEvent[][] = [];

  if (tracks.length === 1) return { tracks: tracksToPiano(tracks), header };

  for (const track of currTracks) {
    if (!isNotEmpty(track) || isDrums(track) || isBass(track)) continue;
    tracks.push(track);
  }
  const reassigned = meta
    ? [meta, ...tracksToPiano(tracks)]
    : tracksToPiano(tracks);

  return { tracks: reassigned, header };
};
