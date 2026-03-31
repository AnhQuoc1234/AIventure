import { TriggerSystem } from './TriggerSystem';
import { TriggerType, TriggerContext } from './TriggerTypes';
import { EventBus } from '../EventBus';

describe('TriggerSystem - FIND_SWITCH', () => {
    let triggerSystem: TriggerSystem;
    let levelManagerMock: any;
    let eventBusEmitSpy: jasmine.Spy;

    beforeEach(() => {
        levelManagerMock = jasmine.createSpyObj('ILevelManager', ['getObjectsByTag'], {
            gridManager: jasmine.createSpyObj('GridManager', ['setBlocker', 'setModelToolMap', 'getInteraction']),
            agents: [jasmine.createSpyObj('AgenticNPC', ['setCommand', 'setThought'])],
            movables: [],
            mapObjects: []
        });
        levelManagerMock.getObjectsByTag.and.returnValue([]);
        levelManagerMock.gridManager.width = 3;
        levelManagerMock.gridManager.height = 3;

        triggerSystem = new TriggerSystem(levelManagerMock);
        eventBusEmitSpy = spyOn(EventBus, 'emit');
    });

    it('should find switches and return their coordinates', () => {
        const context: TriggerContext = {
            type: TriggerType.MODEL_FUNCTION,
            payload: { name: 'find_switch' }
        };

        // Mock grid interactions
        // (1,1) has a switch
        // (2,2) has a treasure (should be ignored)
        levelManagerMock.gridManager.getInteraction.and.callFake((gx: number, gy: number) => {
            if (gx === 1 && gy === 1) return { type: 'switch', name: 'SwitchA' };
            if (gx === 2 && gy === 2) return { type: 'treasure', name: 'Gold' };
            return null;
        });

        triggerSystem.processEvent(context);

        // Check if agent's thought was updated
        expect(levelManagerMock.agents[0].setThought).toHaveBeenCalledWith('I found 1 switch(es).');

        // Check if the result was emitted with correct coordinates
        expect(eventBusEmitSpy).toHaveBeenCalledWith('model-tool-execution-result', jasmine.objectContaining({
            name: 'find_switch',
            output: JSON.stringify([{ x: 1, y: 1, type: 'switch', name: 'SwitchA' }])
        }));
    });

    it('should return empty array if no switches found', () => {
        const context: TriggerContext = {
            type: TriggerType.MODEL_FUNCTION,
            payload: { name: 'find_switch' }
        };

        levelManagerMock.gridManager.getInteraction.and.returnValue(null);

        triggerSystem.processEvent(context);

        expect(levelManagerMock.agents[0].setThought).toHaveBeenCalledWith('I found 0 switch(es).');
        expect(eventBusEmitSpy).toHaveBeenCalledWith('model-tool-execution-result', jasmine.objectContaining({
            name: 'find_switch',
            output: '[]'
        }));
    });
});
