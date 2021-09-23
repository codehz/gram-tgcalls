import { Readable } from 'stream';
import { Api } from 'telegram';

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

export interface Media<T> {
    readable?: Readable;
    options?: T
}

export interface Video {
    width?: number;
    height?: number;
    framerate?: number;
}

export interface Audio {
    bitsPerSample?: number;
    sampleRate?: number;
    channelCount?: number;
    almostFinishedTrigger?: number;
}
