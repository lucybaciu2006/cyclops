export type AgentActivity = 'IDLE' | 'RECORDING';

class AgentRuntimeStateImpl {
  private _recording = false;
  private _preview = false;
  private _recordingId: string | null = null;

  setRecording(on: boolean, id?: string | null) {
    this._recording = !!on;
    this._recordingId = on ? (id ?? this._recordingId) : null;
  }
  setPreview(on: boolean) { this._preview = !!on; }

  get recording() { return this._recording; }
  get recordingId() { return this._recordingId; }
  get preview() { return this._preview; }
  get activity(): AgentActivity { return this._recording ? 'RECORDING' : 'IDLE'; }
}

export const AgentRuntimeState = new AgentRuntimeStateImpl();

