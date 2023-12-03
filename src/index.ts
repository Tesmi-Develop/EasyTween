import Maid from "@rbxts/maid";
import { RunService, TweenService } from "@rbxts/services";
import lerpType from "./lerpType";

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
        if (index === -1) return;

        this.connected = false;
        this.callbacks.remove(index);
    }
}

export type Animatable =
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


export default class EasyTween<T> {
    private goalValue: T;
    private value: T
    private tweenInfo: TweenInfo;
    private callbacksOnChange: callbackOnChange<T>[] = [];
    private callbacksOnReached: callbackOnReached[] = [];
    private isReached = false;
    private progress = 1;
    private startingTime = 0;
    private startValue: T;
    private maid = new Maid();

    constructor(value: T & Animatable, tweenInfo: TweenInfo) {
        this.value = value;
        this.goalValue = value;
		this.startValue = value;
        this.tweenInfo = tweenInfo;

        this.init();
    }

    public Destroy() {
        this.maid.DoCleaning();
    }

    public Set(value: T & Animatable, newTweenInfo?: TweenInfo) {
        this.goalValue = value;
        this.startValue = this.value;
        this.progress = 0;
        this.isReached = false;
        this.startingTime = os.clock();
        this.tweenInfo = newTweenInfo || this.tweenInfo;
    }

    public SetWitoutTween(value: T & Animatable) {
        this.goalValue = value;
        this.startValue = value;
        this.value = value;
        this.progress = 1;
        this.startingTime = os.clock();
        this.isReached = true;
    }

    public StopTween() {
        this.goalValue = this.value;
        this.startValue = this.value;
        this.progress = 1;
        this.startingTime = os.clock();
        this.isReached = true;
    }

    public Get() {
        return this.value;
    }

    public ListenToChange(callback: callbackOnChange<T>) {
        this.callbacksOnChange.push(callback);

        return new Connection(callback, this.callbacksOnChange);
    }

    public ListenToReacheGoal(callback: callbackOnReached) {
        this.callbacksOnReached.push(callback);

        return new Connection(callback, this.callbacksOnReached);
    }

    private init() {
        this.maid.GiveTask(RunService.Heartbeat.Connect((dt) => {
            if (this.progress >= 1) return;

            const endTime = this.tweenInfo.Time + this.startingTime;
            const deltaTime = os.clock() - this.startingTime;

            this.progress = deltaTime / (endTime - this.startingTime);
            
            this.progress = math.clamp(this.progress, 0, 1);
            const alpha = TweenService.GetValue(this.progress, this.tweenInfo.EasingStyle, this.tweenInfo.EasingDirection);

            this.value = lerpType(this.startValue, this.goalValue, alpha);

            this.callbacksOnChange.forEach((callback) => callback(this.value));

            if (this.progress === 1 && !this.isReached) {
                this.isReached = true;
                this.callbacksOnReached.forEach((callback) => callback());
            }
        }));
    }
}
