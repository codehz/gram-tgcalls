import { paramCase } from "param-case";
import { Api, TelegramClient } from "telegram";
import { AudioStream, BaseStream, TGCalls, VideoStream } from "tgcalls";
import * as calls from "./calls";
import * as chats from "./chats";
import { EditParams, JoinParams, Listeners } from "./types";

class MediaProxy<S extends BaseStream<any>> {
  readonly stream: S;
  readonly track: MediaStreamTrack;

  constructor(stream: S, listeners?: Listeners) {
    this.stream = stream;
    this.track = stream.createTrack();
    if (!listeners) {
      this.mute();
      return;
    }
    for (const [k, v] of Object.entries(listeners)) {
      if (v && k.startsWith("on")) stream.on(paramCase(k.slice(2)), v);
    }
  }

  mute() {
    this.track.enabled = false;
  }

  unmute() {
    this.track.enabled = true;
  }
}

export class GramTGCalls {
  private call?: Api.InputGroupCall;
  private tgcalls?: TGCalls<any>;
  #audio?: MediaProxy<AudioStream>;
  #video?: MediaProxy<VideoStream>;

  get audio() {
    return this.#audio;
  }

  get video() {
    return this.#video;
  }

  constructor(
    public client: TelegramClient,
    public chat: Api.TypeEntityLike,
  ) {
    this.client.addEventHandler(this.updateHandler);
  }

  private updateHandler(update: Api.TypeUpdate) {
    if (update instanceof Api.UpdateGroupCall) {
      if (update.call instanceof Api.GroupCallDiscarded) {
        this.close();
        this.reset();
      }
    }
  }

  async start(
    params: Record<"audio" | "video", Listeners> & { join?: JoinParams },
  ) {
    if (!this.tgcalls) {
      this.tgcalls = new TGCalls({}, async (payload) => {
        const fullChat = await chats.getFull(this.client, this.chat);

        if (!fullChat.call) {
          throw new Error("No active call");
        }

        this.call = fullChat.call;

        return await calls.join(this.client, this.call, payload, {
          ...params?.join,
          joinAs: params?.join?.joinAs ?? fullChat.groupcallDefaultJoinAs,
        });
      });
    }
    this.#audio = new MediaProxy(new AudioStream(), params.audio);
    this.#video = new MediaProxy(new VideoStream(), params.video);

    try {
      await this.tgcalls.start(this.#audio?.track!, this.#video?.track!);
    } catch (e) {
      this.stop().catch(console.error);
    }
  }

  private close() {
    this.#audio?.stream.stop();
    this.#video?.stream.stop();
    this.tgcalls?.close();
  }

  private reset() {
    this.call = this.tgcalls = this.#audio = this.#video = undefined;
  }

  /**
   * Stops the stream, closes the WebRTC connection, sends leave request to Telegram and frees up resources. Returns `false` if not in call or `true` if successful.
   */
  async stop() {
    if (!this.call) {
      return false;
    }

    this.close();
    try {
      await calls.leave(this.client, this.call);
    } catch {
      return false;
    } finally {
      this.reset();
    }
    return true;
  }

  /**
   * Edits the provided participant.
   */
  async edit(participant: Api.TypeEntityLike, params: EditParams) {
    if (!this.call) {
      return false;
    }

    await calls.edit(this.client, this.call, participant, params);
    return true;
  }

  /**
   * Alias for `edit`.
   */
  editParticipant = this.edit;

  /**
   * Edits self participant.
   */
  editSelf(params: EditParams) {
    return this.edit("me", params);
  }

  /**
   * Alias for `editSelf`.
   */
  editSelfParticipant = this.editSelf;
}
