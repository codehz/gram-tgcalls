import { Api } from "telegram";
export * from "tgcalls/lib/types";

export interface JoinParams {
  joinAs?: Api.TypeEntityLike;
  muted?: boolean;
  videoStopped?: boolean;
  inviteHash?: string;
}

export interface MediaParams {}

export interface EditParams {
  muted?: boolean;
  volume?: number;
  raiseHand?: boolean;
  videoStopped?: boolean;
  videoPaused?: boolean;
  presentationPaused?: boolean;
}

export interface Listeners {
  [K: `on${string}`]: Function | undefined;
}
