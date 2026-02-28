import fs from 'node:fs';

export class FileWriter {
  private readonly filePath: string;

  private nextData: string | null = null;

  private nextDataPromise: Promise<void> | null = null;

  private nextDataResolve: ((value: void) => void) | null = null;

  private writeIsLocked: boolean = false;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  private lockedWrite(data: string): Promise<void> {
    this.nextData = data;
    this.nextDataPromise =
      this.nextDataPromise ??
      new Promise<void>((resolve) => {
        this.nextDataResolve = resolve;
      });

    return new Promise((resolve) => {
      this.nextDataPromise?.then(() => {
        resolve();
      });
    });
  }

  private async unlockedWrite(data: string, recursionLevel = 0): Promise<void> {
    this.writeIsLocked = true;
    await fs.promises.writeFile(this.filePath, data, 'utf-8');
    this.writeIsLocked = false;

    // ✅ important:
    // copy content of this.nextData into new variable
    // for avoid infinite recursion of 'unlockedWrite'
    const passedData = this.nextData;
    this.nextData = null;

    if (passedData) {
      await this.unlockedWrite(passedData, recursionLevel + 1);
      if (recursionLevel === 0) {
        this.nextDataResolve?.();
        this.nextDataPromise = null;
        this.nextDataResolve = null;
      }
    }
  }

  public write(data: string): Promise<void> {
    return this.writeIsLocked ? this.lockedWrite(data) : this.unlockedWrite(data);
  }
}
