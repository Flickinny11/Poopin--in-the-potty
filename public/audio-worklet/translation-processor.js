/**
 * Audio Worklet Processor for real-time translation
 * Handles audio processing in the audio rendering thread
 */

class TranslationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.translatedAudioQueue = [];
    this.isProcessing = false;
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'translated-audio':
          this.handleTranslatedAudio(data);
          break;
        case 'config':
          this.handleConfig(data);
          break;
      }
    };
  }
  
  handleTranslatedAudio(audioData) {
    // Convert ArrayBuffer to Float32Array
    const float32Data = new Float32Array(audioData);
    this.translatedAudioQueue.push(float32Data);
  }
  
  handleConfig(config) {
    this.bufferSize = config.bufferSize || 4096;
    this.buffer = new Float32Array(this.bufferSize);
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (input.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];
      
      // Process input audio for translation
      this.processInputAudio(inputChannel);
      
      // Output translated audio if available
      this.outputTranslatedAudio(outputChannel);
    }
    
    return true;
  }
  
  processInputAudio(inputChannel) {
    // Buffer input audio and send to main thread for translation
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex] = inputChannel[i];
      this.bufferIndex++;
      
      if (this.bufferIndex >= this.bufferSize) {
        // Buffer is full, send to main thread
        this.port.postMessage({
          type: 'audio-chunk',
          data: this.buffer.slice()
        });
        
        this.bufferIndex = 0;
      }
    }
  }
  
  outputTranslatedAudio(outputChannel) {
    if (this.translatedAudioQueue.length > 0) {
      const translatedAudio = this.translatedAudioQueue.shift();
      
      // Copy translated audio to output
      const length = Math.min(outputChannel.length, translatedAudio.length);
      for (let i = 0; i < length; i++) {
        outputChannel[i] = translatedAudio[i];
      }
      
      // If translated audio is longer than output buffer, 
      // put the remainder back in the queue
      if (translatedAudio.length > outputChannel.length) {
        const remainder = translatedAudio.slice(outputChannel.length);
        this.translatedAudioQueue.unshift(remainder);
      }
    } else {
      // No translated audio available, output silence
      outputChannel.fill(0);
    }
  }
}

registerProcessor('translation-processor', TranslationProcessor);