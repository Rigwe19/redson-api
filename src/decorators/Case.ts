import { useDecorators } from "@tsed/core";
import { Property } from "@tsed/schema";

export type CaseType = "title" | "sentence" | "snake"
export function Case(type: CaseType): PropertyDecorator {
  return useDecorators(
    Property(),
    (target: any, propertyKey: string) => {
      Reflect.defineMetadata(`case:${propertyKey}`, type, target);
    }
  );
}
