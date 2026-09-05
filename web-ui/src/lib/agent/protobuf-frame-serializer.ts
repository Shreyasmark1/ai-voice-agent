import { MessageType, ScalarType } from "@protobuf-ts/runtime";
import type { RTVIMessage } from "@pipecat-ai/client-js";
import type { WebSocketSerializer } from "@pipecat-ai/websocket-transport";

interface ITextFrame {
  id: bigint;
  name: string;
  text: string;
}

interface IAudioRawFrame {
  id: bigint;
  name: string;
  audio: Uint8Array;
  sampleRate: number;
  numChannels: number;
  pts?: bigint;
}

interface ITranscriptionFrame {
  id: bigint;
  name: string;
  text: string;
  userId: string;
  timestamp: string;
}

interface IMessageFrame {
  data: string;
}

interface IInterruptionFrame {
  id: bigint;
  name: string;
}

const TextFrame = new MessageType<ITextFrame>("pipecat.TextFrame", [
  { no: 1, name: "id", kind: "scalar", T: ScalarType.UINT64 },
  { no: 2, name: "name", kind: "scalar", T: ScalarType.STRING },
  { no: 3, name: "text", kind: "scalar", T: ScalarType.STRING },
]);

const AudioRawFrame = new MessageType<IAudioRawFrame>("pipecat.AudioRawFrame", [
  { no: 1, name: "id", kind: "scalar", T: ScalarType.UINT64 },
  { no: 2, name: "name", kind: "scalar", T: ScalarType.STRING },
  { no: 3, name: "audio", kind: "scalar", T: ScalarType.BYTES },
  { no: 4, name: "sampleRate", kind: "scalar", T: ScalarType.UINT32 },
  { no: 5, name: "numChannels", kind: "scalar", T: ScalarType.UINT32 },
  { no: 6, name: "pts", kind: "scalar", T: ScalarType.UINT64, opt: true },
]);

const TranscriptionFrame = new MessageType<ITranscriptionFrame>(
  "pipecat.TranscriptionFrame",
  [
    { no: 1, name: "id", kind: "scalar", T: ScalarType.UINT64 },
    { no: 2, name: "name", kind: "scalar", T: ScalarType.STRING },
    { no: 3, name: "text", kind: "scalar", T: ScalarType.STRING },
    { no: 4, name: "userId", kind: "scalar", T: ScalarType.STRING },
    { no: 5, name: "timestamp", kind: "scalar", T: ScalarType.STRING },
  ]
);

const MessageFrame = new MessageType<IMessageFrame>("pipecat.MessageFrame", [
  { no: 1, name: "data", kind: "scalar", T: ScalarType.STRING },
]);

const InterruptionFrame = new MessageType<IInterruptionFrame>(
  "pipecat.InterruptionFrame",
  [
    { no: 1, name: "id", kind: "scalar", T: ScalarType.UINT64 },
    { no: 2, name: "name", kind: "scalar", T: ScalarType.STRING },
  ]
);

type FrameOneof =
  | { oneofKind: "text"; text: ITextFrame }
  | { oneofKind: "audio"; audio: IAudioRawFrame }
  | { oneofKind: "transcription"; transcription: ITranscriptionFrame }
  | { oneofKind: "message"; message: IMessageFrame }
  | { oneofKind: "interruption"; interruption: IInterruptionFrame }
  | { oneofKind: undefined };

interface IFrame {
  frame?: FrameOneof;
}

const Frame = new MessageType<IFrame>("pipecat.Frame", [
  { no: 1, name: "text", kind: "message", T: () => TextFrame, oneof: "frame" },
  { no: 2, name: "audio", kind: "message", T: () => AudioRawFrame, oneof: "frame" },
  {
    no: 3,
    name: "transcription",
    kind: "message",
    T: () => TranscriptionFrame,
    oneof: "frame",
  },
  { no: 4, name: "message", kind: "message", T: () => MessageFrame, oneof: "frame" },
  {
    no: 5,
    name: "interruption",
    kind: "message",
    T: () => InterruptionFrame,
    oneof: "frame",
  },
]);

export class AgentProtobufFrameSerializer implements WebSocketSerializer {
  serialize(): unknown {
    return undefined;
  }

  serializeAudio(data: ArrayBuffer, sampleRate: number, numChannels: number): Uint8Array {
    const frame = Frame.create({
      frame: {
        oneofKind: "audio",
        audio: {
          id: BigInt(0),
          name: "audio",
          audio: new Uint8Array(data),
          sampleRate,
          numChannels,
        },
      },
    });
    return new Uint8Array(Frame.toBinary(frame));
  }

  serializeMessage(msg: RTVIMessage): Uint8Array {
    const frame = Frame.create({
      frame: {
        oneofKind: "message",
        message: { data: JSON.stringify(msg) },
      },
    });
    return new Uint8Array(Frame.toBinary(frame));
  }

  async deserialize(
    data: Blob | ArrayBuffer | Uint8Array
  ): Promise<
    | { type: "audio"; audio: Int16Array }
    | { type: "message"; message: RTVIMessage }
    | { type: "raw"; message: unknown }
  > {
    let bytes: Uint8Array;
    if (data instanceof Blob) {
      bytes = new Uint8Array(await data.arrayBuffer());
    } else if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      bytes = data;
    } else {
      throw new Error("Unknown data type");
    }

    const parsed = Frame.fromBinary(bytes);
    const frame = parsed.frame;

    if (frame?.oneofKind === "audio" && frame.audio) {
      const uint8Array = new Uint8Array(Array.from(frame.audio.audio));
      return { type: "audio", audio: new Int16Array(uint8Array.buffer) };
    }

    if (frame?.oneofKind === "message" && frame.message) {
      const message = JSON.parse(frame.message.data) as RTVIMessage;
      return { type: "message", message };
    }

    if (frame?.oneofKind === "interruption") {
      return { type: "raw", message: null };
    }

    if (frame?.oneofKind === "text" || frame?.oneofKind === "transcription") {
      console.warn("[voice-agent] Ignoring unsupported frame:", frame.oneofKind);
      return { type: "raw", message: null };
    }

    if (frame?.oneofKind === undefined) {
      console.warn("[voice-agent] Ignoring frame with unknown kind");
      return { type: "raw", message: null };
    }

    throw new Error("Unknown frame kind");
  }
}