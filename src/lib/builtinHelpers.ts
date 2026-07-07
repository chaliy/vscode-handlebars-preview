import type * as Handlebars from "handlebars";

const comparisonOperators = new Set(["==", "===", "!=", "!==", "<", ">", "<=", ">=", "typeof"]);

function isNumeric(value: unknown): boolean {
    return (typeof value === "number" && Number.isFinite(value))
        || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)));
}

function valuesEqual(left: unknown, right: unknown, strict: boolean): boolean {
    if (Object.is(left, right)) {
        return true;
    }

    if (strict) {
        return false;
    }

    if ((left === null && right === undefined) || (left === undefined && right === null)) {
        return true;
    }

    if (isNumeric(left) && isNumeric(right)) {
        return Number(left) === Number(right);
    }

    return String(left) === String(right);
}

function compareValues(left: unknown, operator: string, right: unknown): boolean {
    switch (operator) {
        case "==":
            return valuesEqual(left, right, false);
        case "===":
            return valuesEqual(left, right, true);
        case "!=":
            return !valuesEqual(left, right, false);
        case "!==":
            return !valuesEqual(left, right, true);
        case "<":
            return isNumeric(left) && isNumeric(right) ? Number(left) < Number(right) : String(left) < String(right);
        case ">":
            return isNumeric(left) && isNumeric(right) ? Number(left) > Number(right) : String(left) > String(right);
        case "<=":
            return isNumeric(left) && isNumeric(right) ? Number(left) <= Number(right) : String(left) <= String(right);
        case ">=":
            return isNumeric(left) && isNumeric(right) ? Number(left) >= Number(right) : String(left) >= String(right);
        case "typeof":
            return typeof left === right;
        default:
            throw new Error(`Unsupported compare operator "${operator}".`);
    }
}

function renderBooleanResult(thisArg: unknown, result: boolean, options: unknown): unknown {
    const helperOptions = options as Partial<Handlebars.HelperOptions>;

    if (typeof helperOptions.fn === "function" && typeof helperOptions.inverse === "function") {
        return result ? helperOptions.fn(thisArg) : helperOptions.inverse(thisArg);
    }

    return result;
}

function getOperatorFromOptions(options: unknown): string | undefined {
    const helperOptions = options as Partial<Handlebars.HelperOptions>;
    const operator = helperOptions.hash?.operator;

    return typeof operator === "string" ? operator : undefined;
}

export function registerBuiltinHelpers(handlebars: typeof Handlebars): void {
    handlebars.registerHelper("eq", function eqHelper(this: unknown, left: unknown, right: unknown, options: unknown): unknown {
        return renderBooleanResult(this, valuesEqual(left, right, false), options);
    });

    handlebars.registerHelper("compare", function compareHelper(this: unknown, ...args: unknown[]): unknown {
        const options = args.at(-1);
        const values = args.slice(0, -1);
        let left: unknown;
        let right: unknown;
        let operator = getOperatorFromOptions(options) ?? "==";

        if (values.length === 3 && typeof values[1] === "string" && comparisonOperators.has(values[1])) {
            [left, operator, right] = values;
        } else if (values.length === 2) {
            [left, right] = values;
        } else {
            throw new Error("Helper \"compare\" needs two values and an optional operator.");
        }

        return renderBooleanResult(this, compareValues(left, operator, right), options);
    });

    handlebars.registerHelper("eval", (value: unknown) => value);
}
