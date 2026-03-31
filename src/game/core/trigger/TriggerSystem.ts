import { ILevelManager } from '../Interfaces';
import { EventBus } from '../EventBus';
import { TriggerType, TriggerContext, Rule, Action } from './TriggerTypes';
import { PUZZLE_RULES } from './PuzzleRules';
import { executeAction } from './actions/ActionHandlers';

export class TriggerSystem {
    private levelManager: ILevelManager;
    private rules: Rule[] = [];

    constructor(levelManager: ILevelManager) {
        this.levelManager = levelManager;
        this.loadRules();
    }

    private loadRules() {
        this.rules = [...PUZZLE_RULES];
    }

    public processEvent(context: TriggerContext) {
        let interactionResult = null;
        for (const rule of this.rules) {
            if (rule.trigger(context)) {
                console.log(`Rule matched: ${rule.id}`);
                const actionResult = this.executeActions(rule.actions, context);
                if (actionResult) interactionResult = actionResult;
            }
        }

        if (context.type === TriggerType.MODEL_FUNCTION && context.payload?.name) {
            EventBus.emit('model-tool-execution-result', {
                name: context.payload.name,
                output: interactionResult || "Action executed."
            });
       }
    }

    private executeActions(actions: Action[], context: TriggerContext): string | null {
        let result = null;
        for (const action of actions) {
            const res = executeAction(action.type, this.levelManager, action.params, context);
            if (res) result = res;
        }
        return result;
    }
}
