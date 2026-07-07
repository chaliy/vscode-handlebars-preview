import type * as Handlebars from "handlebars";

export type HelperMap = Record<string, Handlebars.HelperDelegate>;
export type HelperRegistrar = (handlebars: typeof Handlebars) => void;
export type HelperDescriptor = {
    name: string;
    body: Handlebars.HelperDelegate;
};
export type HelperRegistrations = HelperMap | HelperDescriptor[] | HelperRegistrar;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeHelperModule(value: unknown): string {
    if (Array.isArray(value)) {
        return "array";
    }

    return value === null ? "null" : typeof value;
}

export function normalizeHelperModule(value: unknown): HelperRegistrations {
    if (typeof value === "function") {
        return value as HelperRegistrar;
    }

    if (Array.isArray(value)) {
        value.forEach((entry, index) => {
            if (!isRecord(entry) || typeof entry.name !== "string" || typeof entry.body !== "function") {
                throw new Error(`Expected helper descriptor at index ${index} to include string "name" and function "body".`);
            }
        });

        return value as HelperDescriptor[];
    }

    if (isRecord(value)) {
        Object.entries(value).forEach(([name, helper]) => {
            if (typeof helper !== "function") {
                throw new Error(`Expected helper "${name}" to be a function.`);
            }
        });

        return value as HelperMap;
    }

    throw new Error(`Expected helper module to export an object, descriptor array, or registration function. Got ${describeHelperModule(value)}.`);
}

export function registerHelpers(handlebars: typeof Handlebars, helpers: HelperRegistrations): void {
    if (typeof helpers === "function") {
        helpers(handlebars);
        return;
    }

    if (Array.isArray(helpers)) {
        helpers.forEach(({ name, body }) => handlebars.registerHelper(name, body));
        return;
    }

    Object.entries(helpers).forEach(([name, helper]) => {
        handlebars.registerHelper(name, helper);
    });
}
