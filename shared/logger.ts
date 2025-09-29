class ConsoleLogger {
  private readonly base: string;
  constructor(base: string) {
    this.base = base;
  }

  public debug(...message: any[]) {
    console.debug(this.base + " : ", message)
  }

  public error(...message: any[]){
    console.error(this.base + " : ", message);
  }

}

export default function Logger(name: string) {
  return new ConsoleLogger(name);
}