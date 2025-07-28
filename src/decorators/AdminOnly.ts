
export interface AdminOnlyOptions {

}

export function AdminOnly(options: AdminOnlyOptions): ClassDecorator {
  return (target: any): any => {
    return class extends target {
      constructor(...args: any[]) {
        super(...args);
      }
    };
  };
}
