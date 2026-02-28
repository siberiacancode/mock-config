export declare class FileWriter {
    private readonly filePath;
    private nextData;
    private nextDataPromise;
    private nextDataResolve;
    private writeIsLocked;
    constructor(filePath: string);
    private lockedWrite;
    private unlockedWrite;
    write(data: string): Promise<void>;
}
