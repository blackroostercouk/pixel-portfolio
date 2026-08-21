export type StateDefinition<TState extends string> = {
  enter?: (previousState?: TState) => void;
  update?: (deltaMs: number, elapsedMs: number) => void;
  durationMs?: number;
  nextState?: TState;
};

export class StateMachine<TState extends string> {
  private elapsedMs = 0;

  constructor(
    private currentState: TState,
    private readonly definitions: Record<TState, StateDefinition<TState>>,
  ) {
    this.definitions[this.currentState]?.enter?.();
  }

  get state() {
    return this.currentState;
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs;

    const stateDefinition = this.definitions[this.currentState];
    stateDefinition?.update?.(deltaMs, this.elapsedMs);

    if (
      stateDefinition?.durationMs !== undefined &&
      stateDefinition.nextState &&
      this.elapsedMs >= stateDefinition.durationMs
    ) {
      this.transitionTo(stateDefinition.nextState);
    }
  }

  transitionTo(nextState: TState) {
    if (nextState === this.currentState) {
      return;
    }

    const previousState = this.currentState;
    this.currentState = nextState;
    this.elapsedMs = 0;
    this.definitions[this.currentState]?.enter?.(previousState);
  }
}
