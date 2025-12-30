export type CodecType = 'opus' | 'pcmu' | 'pcma';

export function audioFormatForCodec(codec: string): string {
  switch (codec.toLowerCase()) {
    case 'pcmu':
    case 'pcma':
      return 'g711_ulaw';
    case 'opus':
    default:
      return 'pcm16';
  }
}

export function applyCodecPreferences(pc: RTCPeerConnection, codec: string): void {
  const transceivers = pc.getTransceivers();
  
  for (const transceiver of transceivers) {
    if (transceiver.sender.track?.kind === 'audio' || transceiver.receiver.track?.kind === 'audio') {
      const codecs = RTCRtpReceiver.getCapabilities('audio')?.codecs || [];
      
      let preferredCodec: RTCRtpCodecCapability | undefined;
      
      switch (codec.toLowerCase()) {
        case 'pcmu':
          preferredCodec = codecs.find(c => c.mimeType === 'audio/PCMU');
          break;
        case 'pcma':
          preferredCodec = codecs.find(c => c.mimeType === 'audio/PCMA');
          break;
        case 'opus':
        default:
          preferredCodec = codecs.find(c => c.mimeType === 'audio/opus');
          break;
      }
      
      if (preferredCodec) {
        const orderedCodecs = [preferredCodec, ...codecs.filter(c => c !== preferredCodec)];
        try {
          transceiver.setCodecPreferences(orderedCodecs);
        } catch (e) {
          console.warn('Failed to set codec preferences:', e);
        }
      }
    }
  }
}
