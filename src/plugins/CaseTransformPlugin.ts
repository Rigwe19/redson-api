import { Schema } from "mongoose";
// import { startCase } from "lodash";
import cased from "case";

function toSentenceCase(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toSnakeCase(str: string) {
  return str
    .replace(/\s+/g, '_')
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .toLowerCase();
}

function toTitleCase(str: string) {
  return cased.title(str.toLowerCase());
}

export function CaseTransformPlugin(schema: Schema) {
  schema.pre("save", function (next) {
    const doc = this;

    for (const path in schema.paths) {
      const type = Reflect.getMetadata(`case:${path}`, doc);

      if (type && typeof doc[path] === "string") {
        switch (type) {
          case "title":
            doc[path] = toTitleCase(doc[path]);
            break;
          case "sentence":
            doc[path] = toSentenceCase(doc[path]);
            break;
          case "snake":
            doc[path] = toSnakeCase(doc[path]);
            break;
        }
      }
    }

    next();
  });
}
