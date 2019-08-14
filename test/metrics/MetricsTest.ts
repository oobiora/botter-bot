import * as expect from "expect";
import * as simple from "simple-mock";
import { IMetricContext, IMetricListener, Metrics } from "../../src";

function createTestMetricListener(expectedName: string, expectedContext: IMetricContext, validateNumberFn: (i: number) => void): IMetricListener {
    return {
        onIncrement: simple.stub().callFn((name: string, context: IMetricContext, amount: number) => {
            expect(name).toBe(expectedName);
            // @ts-ignore
            expect(context).toMatchObject(expectedContext);
            validateNumberFn(amount);
        }),
        onDecrement: simple.stub().callFn((name: string, context: IMetricContext, amount: number) => {
            expect(name).toBe(expectedName);
            // @ts-ignore
            expect(context).toMatchObject(expectedContext);
            validateNumberFn(amount);
        }),
        onReset: simple.stub().callFn((name: string, context: IMetricContext) => {
            expect(name).toBe(expectedName);
            // @ts-ignore
            expect(context).toMatchObject(expectedContext);
        }),
        onStartMetric: simple.stub().callFn((name: string, context: IMetricContext) => {
            expect(name).toBe(expectedName);
            // @ts-ignore
            expect(context).toMatchObject(expectedContext);
        }),
        onEndMetric: simple.stub().callFn((name: string, context: IMetricContext, timeMs: number) => {
            expect(name).toBe(expectedName);
            // @ts-ignore
            expect(context).toMatchObject(expectedContext);
            validateNumberFn(timeMs);
        }),
    };
}

// @ts-ignore
describe('Metrics', () => {
    // @ts-ignore
    it('should support listeners', async () => {
        const metrics = new Metrics();
        const listeners = () => (<any>metrics).listeners;

        // Verify that our hack is in the right place
        expect(listeners()).toBeDefined();
        expect(listeners().length).toBe(0);

        const listener = <IMetricListener>{};
        metrics.registerListener(listener);
        expect(listeners()).toBeDefined();
        expect(listeners().length).toBe(1);

        metrics.unregisterListener(listener);
        expect(listeners()).toBeDefined();
        expect(listeners().length).toBe(0);
    });

    // @ts-ignore
    it('should track time series metrics', async () => {
        const metrics = new Metrics();
        const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
        const metricName = "test_metric";
        const tolerance = 15;
        const delayMs = 200;

        const listener = createTestMetricListener(metricName, context, (i: number) => {
            expect(i).toBeGreaterThan(delayMs - tolerance);
            expect(i).toBeLessThan(delayMs + tolerance);
        });
        metrics.registerListener(listener);

        metrics.start(metricName, context);
        await new Promise((resolve) => {
            setTimeout(resolve, delayMs);
        });
        metrics.end(metricName, context);

        expect((<any>listener.onStartMetric).callCount).toBe(1);
        expect((<any>listener.onEndMetric).callCount).toBe(1);
        expect((<any>listener.onIncrement).callCount).toBe(0);
        expect((<any>listener.onDecrement).callCount).toBe(0);
        expect((<any>listener.onReset).callCount).toBe(0);
    });

    // @ts-ignore
    it('should track time series metrics with parent', async () => {
        const parentMetrics = new Metrics();
        const metrics = new Metrics(parentMetrics);
        const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
        const metricName = "test_metric";
        const tolerance = 15;
        const delayMs = 200;

        const parentListener = createTestMetricListener(metricName, context, (i: number) => {
            expect(i).toBeGreaterThan(delayMs - tolerance);
            expect(i).toBeLessThan(delayMs + tolerance);
        });
        parentMetrics.registerListener(parentListener);

        const listener = createTestMetricListener(metricName, context, (i: number) => {
            expect(i).toBeGreaterThan(delayMs - tolerance);
            expect(i).toBeLessThan(delayMs + tolerance);
        });
        metrics.registerListener(listener);

        metrics.start(metricName, context);
        await new Promise((resolve) => {
            setTimeout(resolve, delayMs);
        });
        metrics.end(metricName, context);

        expect((<any>parentListener.onStartMetric).callCount).toBe(1);
        expect((<any>parentListener.onEndMetric).callCount).toBe(1);
        expect((<any>parentListener.onIncrement).callCount).toBe(0);
        expect((<any>parentListener.onDecrement).callCount).toBe(0);
        expect((<any>parentListener.onReset).callCount).toBe(0);

        expect((<any>listener.onStartMetric).callCount).toBe(1);
        expect((<any>listener.onEndMetric).callCount).toBe(1);
        expect((<any>listener.onIncrement).callCount).toBe(0);
        expect((<any>listener.onDecrement).callCount).toBe(0);
        expect((<any>listener.onReset).callCount).toBe(0);
    });

    // @ts-ignore
    describe('increment', () => {
        // @ts-ignore
        it('should increment', async () => {
            const metrics = new Metrics();
            const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
            const metricName = "test_metric";
            const amount = 15;

            const listener = createTestMetricListener(metricName, context, (i: number) => {
                expect(i).toBe(amount);
            });
            metrics.registerListener(listener);

            metrics.increment(metricName, context, amount);

            expect((<any>listener.onStartMetric).callCount).toBe(0);
            expect((<any>listener.onEndMetric).callCount).toBe(0);
            expect((<any>listener.onIncrement).callCount).toBe(1);
            expect((<any>listener.onDecrement).callCount).toBe(0);
            expect((<any>listener.onReset).callCount).toBe(0);
        });

        // @ts-ignore
        it('should increment with parent', async () => {
            const parentMetrics = new Metrics();
            const metrics = new Metrics(parentMetrics);
            const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
            const metricName = "test_metric";
            const amount = 15;

            const parentListener = createTestMetricListener(metricName, context, (i: number) => {
                expect(i).toBe(amount);
            });
            parentMetrics.registerListener(parentListener);

            const listener = createTestMetricListener(metricName, context, (i: number) => {
                expect(i).toBe(amount);
            });
            metrics.registerListener(listener);

            metrics.increment(metricName, context, amount);

            expect((<any>parentListener.onStartMetric).callCount).toBe(0);
            expect((<any>parentListener.onEndMetric).callCount).toBe(0);
            expect((<any>parentListener.onIncrement).callCount).toBe(1);
            expect((<any>parentListener.onDecrement).callCount).toBe(0);
            expect((<any>parentListener.onReset).callCount).toBe(0);

            expect((<any>listener.onStartMetric).callCount).toBe(0);
            expect((<any>listener.onEndMetric).callCount).toBe(0);
            expect((<any>listener.onIncrement).callCount).toBe(1);
            expect((<any>listener.onDecrement).callCount).toBe(0);
            expect((<any>listener.onReset).callCount).toBe(0);
        });
    });

    // @ts-ignore
    describe('decrement', () => {
        // @ts-ignore
        it('should decrement', async () => {
            const metrics = new Metrics();
            const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
            const metricName = "test_metric";
            const amount = 15;

            const listener = createTestMetricListener(metricName, context, (i: number) => {
                expect(i).toBe(amount);
            });
            metrics.registerListener(listener);

            metrics.decrement(metricName, context, amount);

            expect((<any>listener.onStartMetric).callCount).toBe(0);
            expect((<any>listener.onEndMetric).callCount).toBe(0);
            expect((<any>listener.onIncrement).callCount).toBe(0);
            expect((<any>listener.onDecrement).callCount).toBe(1);
            expect((<any>listener.onReset).callCount).toBe(0);
        });

        // @ts-ignore
        it('should decrement with parent', async () => {
            const parentMetrics = new Metrics();
            const metrics = new Metrics(parentMetrics);
            const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
            const metricName = "test_metric";
            const amount = 15;

            const parentListener = createTestMetricListener(metricName, context, (i: number) => {
                expect(i).toBe(amount);
            });
            parentMetrics.registerListener(parentListener);

            const listener = createTestMetricListener(metricName, context, (i: number) => {
                expect(i).toBe(amount);
            });
            metrics.registerListener(listener);

            metrics.decrement(metricName, context, amount);

            expect((<any>parentListener.onStartMetric).callCount).toBe(0);
            expect((<any>parentListener.onEndMetric).callCount).toBe(0);
            expect((<any>parentListener.onIncrement).callCount).toBe(0);
            expect((<any>parentListener.onDecrement).callCount).toBe(1);
            expect((<any>parentListener.onReset).callCount).toBe(0);

            expect((<any>listener.onStartMetric).callCount).toBe(0);
            expect((<any>listener.onEndMetric).callCount).toBe(0);
            expect((<any>listener.onIncrement).callCount).toBe(0);
            expect((<any>listener.onDecrement).callCount).toBe(1);
            expect((<any>listener.onReset).callCount).toBe(0);
        });
    });

    // @ts-ignore
    describe('reset', () => {
        // @ts-ignore
        it('should reset', async () => {
            const metrics = new Metrics();
            const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
            const metricName = "test_metric";

            const listener = createTestMetricListener(metricName, context, (i: number) => {
                throw new Error("Unexpected number");
            });
            metrics.registerListener(listener);

            metrics.reset(metricName, context);

            expect((<any>listener.onStartMetric).callCount).toBe(0);
            expect((<any>listener.onEndMetric).callCount).toBe(0);
            expect((<any>listener.onIncrement).callCount).toBe(0);
            expect((<any>listener.onDecrement).callCount).toBe(0);
            expect((<any>listener.onReset).callCount).toBe(1);
        });

        // @ts-ignore
        it('should reset with parent', async () => {
            const parentMetrics = new Metrics();
            const metrics = new Metrics(parentMetrics);
            const context = <IMetricContext>{uniqueId: "test1234", hello: "world"};
            const metricName = "test_metric";

            const parentListener = createTestMetricListener(metricName, context, (i: number) => {
                throw new Error("Unexpected number");
            });
            parentMetrics.registerListener(parentListener);

            const listener = createTestMetricListener(metricName, context, (i: number) => {
                throw new Error("Unexpected number");
            });
            metrics.registerListener(listener);

            metrics.reset(metricName, context);

            expect((<any>parentListener.onStartMetric).callCount).toBe(0);
            expect((<any>parentListener.onEndMetric).callCount).toBe(0);
            expect((<any>parentListener.onIncrement).callCount).toBe(0);
            expect((<any>parentListener.onDecrement).callCount).toBe(0);
            expect((<any>parentListener.onReset).callCount).toBe(1);

            expect((<any>listener.onStartMetric).callCount).toBe(0);
            expect((<any>listener.onEndMetric).callCount).toBe(0);
            expect((<any>listener.onIncrement).callCount).toBe(0);
            expect((<any>listener.onDecrement).callCount).toBe(0);
            expect((<any>listener.onReset).callCount).toBe(1);
        });
    });
});
