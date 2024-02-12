import { NoteSequence } from "./protobuf";
import * as constants from "./constants";
import { Midi } from "@tonejs/midi";

export function midiToSequenceProto(
  midi: ArrayBuffer | Uint8Array
): NoteSequence {
  const parsedMidi = new Midi(midi);
  const ns = NoteSequence.create();

  ns.ticksPerQuarter = parsedMidi.header.ppq;
  ns.sourceInfo = NoteSequence.SourceInfo.create({
    parser: NoteSequence.SourceInfo.Parser.TONEJS_MIDI_CONVERT,
    encodingType: NoteSequence.SourceInfo.EncodingType.MIDI,
  });

  for (const ts of parsedMidi.header.timeSignatures) {
    ns.timeSignatures.push(
      NoteSequence.TimeSignature.create({
        time: parsedMidi.header.ticksToSeconds(ts.ticks),
        numerator: ts.timeSignature[0],
        denominator: ts.timeSignature[1],
      })
    );
  }
  if (!ns.timeSignatures.length) {
    // Assume a default time signature of 4/4.
    ns.timeSignatures.push(
      NoteSequence.TimeSignature.create({
        time: 0,
        numerator: 4,
        denominator: 4,
      })
    );
  }

  // TODO(fjord): Add key signatures.

  for (const tempo of parsedMidi.header.tempos) {
    ns.tempos.push(
      NoteSequence.Tempo.create({
        time: tempo.time,
        qpm: tempo.bpm,
      })
    );
  }

  // We want a unique instrument number for each combination of track and
  // program number.
  let instrumentNumber = -1;
  for (const track of parsedMidi.tracks) {
    // TODO(fjord): support changing programs within a track when
    // Tonejs/Midi does. When that happens, we'll need a map to keep track
    // of which program number within a track corresponds to what instrument
    // number, similar to how pretty_midi works.
    if (track.notes.length > 0) {
      instrumentNumber += 1;
    }

    for (const note of track.notes) {
      const startTime: number = note.time;
      const duration: number = note.duration;
      const endTime: number = startTime + duration;

      ns.notes.push(
        NoteSequence.Note.create({
          instrument: instrumentNumber,
          program: track.instrument.number,
          startTime,
          endTime,
          pitch: note.midi,
          velocity: Math.floor(note.velocity * constants.MIDI_VELOCITIES),
          isDrum: track.instrument.percussion,
        })
      );

      if (endTime > ns.totalTime) {
        ns.totalTime = endTime;
      }
    }

    const controlChangeValues = Object.values(track.controlChanges);
    const flattenedControlChangeValues = controlChangeValues.flat();
    for (const controlChange of flattenedControlChangeValues) {
      ns.controlChanges.push(
        NoteSequence.ControlChange.create({
          time: controlChange.time,
          controlNumber: controlChange.number,
          controlValue: Math.floor(
            controlChange.value * (constants.MIDI_VELOCITIES - 1)
          ),
          instrument: instrumentNumber,
          program: track.instrument.number,
          isDrum: track.instrument.percussion,
        })
      );
    }

    // TODO: Support pitch bends.
  }

  return ns;
}
