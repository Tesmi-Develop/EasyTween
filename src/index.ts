import Maid from "@rbxts/maid";
import { RunService, TweenService } from "@rbxts/services";

type callbackOnChange<T> = (value: T) => void;
type callbackOnReached = () => void;

class Connection {
    private connected = true;
    private callback: Callback;
    private callbacks: Callback[];

    constructor(callback: Callback, callbacks: Callback[]) {
        this.callback = callback;
        this.callbacks = callbacks;
    }

    public GetConnected() { return this.connected; }

    public Disconnect() {
        const index = this.callbacks.indexOf(this.callback);
        assert(index !== -1, 'The connection is already broken.');

        this.connected = false;
        this.callbacks.remove(index);
    }
}

type Animatable =
	| number
	| CFrame
	| Color3
	| ColorSequenceKeypoint
	| DateTime
	| NumberRange
	| NumberSequenceKeypoint
	| PhysicalProperties
	| Ray
	| Rect
	| Region3
	| Region3int16
	| UDim
	| UDim2
	| Vector2
	| Vector2int16
	| Vector3
	| Vector3int16;


export default class EasyTween<T extends Animatable> {
    private goalValue: T;
    private value: T
    private time: number;
    private easingStyle: Enum.EasingStyle;
    private easingDirection: Enum.EasingDirection;
    private callbacksOnChange: callbackOnChange<T>[] = [];
    private callbacksOnReached: callbackOnReached[] = [];
    private isReached = false;
    private progress = 0;
    private startValue: T;
    private maid = new Maid();

    constructor(value: T, easingStyle = Enum.EasingStyle.Linear, easingDirection = Enum.EasingDirection.In, time = 1) {
        this.value = value;
        this.goalValue = value;
		this.startValue = value;
        this.time = time;
        this.easingStyle = easingStyle;
        this.easingDirection = easingDirection; 

        this.init();
    }

    public Destroy() {
        this.maid.DoCleaning();
    }

    public Set(value: T) {
        this.goalValue = value;
        this.startValue = this.value;
        this.progress = 0;
        this.isReached = false;
    }

    public Get() {
        return this.value;
    }

    public OnChange(callback: callbackOnChange<T>) {
        this.callbacksOnChange.push(callback);

        return new Connection(callback, this.callbacksOnChange);
    }

    public OnReachedGoal(callback: callbackOnReached) {
        this.callbacksOnReached.push(callback);

        return new Connection(callback, this.callbacksOnReached);
    }

    private init() {
        this.maid.GiveTask(RunService.Heartbeat.Connect((dt) => {
            if (this.progress === 1) return;

            const delta = 1 / (60 * this.time)
            this.progress += delta + delta * dt;
            this.progress = math.clamp(this.progress, 0, 1);
            const alpha = TweenService.GetValue(this.progress, this.easingStyle, this.easingDirection);

            this.value = lerpType(this.startValue, this.goalValue, alpha);

            this.callbacksOnChange.forEach((callback) => callback(this.value));

            if (this.progress === 1 && !this.isReached) {
                this.isReached = true;
                this.callbacksOnReached.forEach((callback) => callback());
            }
        }));
    }
}